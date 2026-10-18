import { inflateSync } from "node:zlib";
import { artifactKeyForUrl, getArtifact } from "@/lib/storage";
import { describeImage, MAX_VISION_BYTES } from "./vision";

/**
 * readAttachments — the attachments pass.
 *
 * The composer accepts URL / PDF / image / video / audio attachments, and
 * the original product's promise is that the agent USES them. This module
 * extracts machine-readable content for each attachment so the (text-only)
 * plan LLM works from the actual material, never a filename alone:
 *
 *  - image: bytes from storage → vision model description
 *  - pdf:   bytes from storage → minimal text extraction (FlateDecode +
 *          Tj/TJ text operators; no dependency)
 *  - url:  SSRF-guarded fetch → HTML stripped to text (or PDF extraction)
 *  - video / audio: honest reference note — the agent cannot watch/listen
 *
 * Every attachment resolves to a digest string (what the agent "read").
 * Failures never break the chat turn: they resolve to an honest
 * "could not read" note the plan prompt is instructed to surface.
 */

export interface RawAttachment {
  kind: string;
  value: string;
}

export interface ReadAttachment {
  kind: string;
  value: string;
  /** Machine-extracted content (or an honest failure note) for this attachment. */
  digest: string;
}

/** Per-attachment budget for the whole extraction (fetch + model). */
const PER_ATTACHMENT_TIMEOUT_MS = 30_000;
/** Max bytes pulled for a URL attachment. */
const MAX_URL_BYTES = 2 * 1024 * 1024;
/** Digest text cap. */
const MAX_DIGEST_CHARS = 2400;

function cap(text: string, max = MAX_DIGEST_CHARS): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/* ------------------------------------------------------------------ */
/* PDF text extraction (dependency-free best effort)                   */
/* ------------------------------------------------------------------ */

/** Decode a PDF literal string body (handles \( \) \\ \r \n \t \ooo). */
function decodePdfString(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) break;
    if (next === "(" || next === ")" || next === "\\") {
      out += next;
      i++;
    } else if (next === "n") {
      out += "\n";
      i++;
    } else if (next === "r") {
      out += "\r";
      i++;
    } else if (next === "t") {
      out += "\t";
      i++;
    } else if (next >= "0" && next <= "7") {
      const oct = raw.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] ?? "";
      out += String.fromCharCode(parseInt(oct, 8) & 0xff);
      i += oct.length;
    } else {
      out += next;
      i++;
    }
  }
  return out;
}

/** Collect text from one decoded PDF content stream. */
function textFromContentStream(content: string): string {
  const parts: string[] = [];
  // (string) Tj — whole strings
  const tj = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tj.exec(content)) !== null) parts.push(decodePdfString(m[1]));
  // [(frag) -200 (frag) ...] TJ — string fragments with numeric kerning
  // offsets. Fragments join directly; a large offset (|n| > 200) between
  // fragments means a real word gap.
  const tjBlock = /\[((?:[^\[\]]|\\.)*)\]\s*TJ/g;
  while ((m = tjBlock.exec(content)) !== null) {
    const tokenRe = /\(((?:\\.|[^\\()])*)\)|(-?\d+(?:\.\d+)?)/g;
    let t: RegExpExecArray | null;
    const pending: string[] = [];
    while ((t = tokenRe.exec(m[1])) !== null) {
      if (t[1] !== undefined) {
        pending.push(decodePdfString(t[1]));
      } else if (t[2] !== undefined && Math.abs(parseFloat(t[2])) > 200) {
        if (pending.length > 0 && pending[pending.length - 1] !== " ") {
          pending.push(" ");
        }
      }
    }
    parts.push(pending.join(""));
  }
  return parts.join(" ");
}

function readableText(text: string): string {
  const filtered = Array.from(text)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 0xd7ff)
        ? ch
        : " ";
    })
    .join("");
  return filtered.replace(/ {2,}/g, " ").trim();
}

/**
 * Minimal PDF → text. Scans stream…endstream chunks, inflates
 * FlateDecode payloads, and pulls Tj/TJ literal strings. Handles the
 * common text PDFs (Word/LaTeX/printer drivers); scanned or exotic-font
 * PDFs honestly return "" (the caller then asks the user for text).
 */
export function pdfToText(bytes: Buffer): string {
  const latin = bytes.toString("latin1");
  const out: string[] = [];
  const streamRe = /stream\r?\n?/g;
  let match: RegExpExecArray | null;
  let scanned = 0;
  while ((match = streamRe.exec(latin)) !== null && scanned < 40) {
    const start = match.index + match[0].length;
    const end = latin.indexOf("endstream", start);
    if (end === -1) break;
    streamRe.lastIndex = end;
    scanned++;
    const chunk = latin.slice(start, end);
    let content = "";
    const buf = Buffer.from(chunk, "latin1");
    try {
      content = inflateSync(buf).toString("latin1");
    } catch {
      // Uncompressed stream (or not deflate): use it as-is if it looks
      // like a content stream with text operators.
      content = /\bTj\b|\bTJ\b/.test(chunk) ? chunk : "";
    }
    if (!content) continue;
    out.push(textFromContentStream(content));
    if (out.join(" ").length > MAX_DIGEST_CHARS * 2) break;
  }
  const text = readableText(out.join(" "));
  return text.length >= 20 ? text : "";
}

/* ------------------------------------------------------------------ */
/* HTML → text                                                          */
/* ------------------------------------------------------------------ */

/** Strip an HTML document down to visible-ish text. */
export function htmlToText(html: string): string {
  let text = html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    hellip: "…",
    mdash: "—",
    ndash: "–",
  };
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
  text = text.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCodePoint(parseInt(dec, 10))
  );
  text = text.replace(/&([a-z]+);/gi, (whole, name: string) =>
    entities[name.toLowerCase()] ?? whole
  );
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* URL fetch (SSRF-guarded)                                            */
/* ------------------------------------------------------------------ */

const BLOCKED_HOST = /^(localhost|.*\.localhost|.*\.internal)$/i;

function isPrivateHost(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, "").split("%")[0];
  if (
    bare === "0.0.0.0" ||
    bare === "::" ||
    bare === "::1" ||
    bare.startsWith("fc") ||
    bare.startsWith("fd") ||
    bare.startsWith("fe80")
  ) {
    return true;
  }
  const m = bare.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

/** Fetch an external URL for its text content (bounded, SSRF-guarded). */
async function fetchUrlText(
  url: string
): Promise<{ text: string; note: string } | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  const host = parsed.hostname;
  if (BLOCKED_HOST.test(host) || isPrivateHost(host)) return null;

  const res = await fetch(parsed, {
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "User-Agent": "pexo-clone-agent/1.0 (+attachment reader)",
      Accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5",
    },
  });
  if (!res.ok) return { text: "", note: `the URL responded HTTP ${res.status}` };
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0];
  const reader = res.body?.getReader();
  if (!reader) return { text: "", note: "the URL returned no body" };
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_URL_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  try {
    await reader.cancel();
  } catch {
    /* already closed */
  }
  const bytes = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  if (contentType === "application/pdf") {
    const text = pdfToText(bytes);
    return text
      ? { text: cap(text), note: "pdf page" }
      : { text: "", note: "the PDF at that URL had no extractable text" };
  }
  const body = bytes.toString("utf8");
  if (/html|xml/i.test(contentType) || /^\s*<(!doctype|html)/i.test(body)) {
    return { text: cap(htmlToText(body)), note: "web page" };
  }
  return { text: cap(body), note: "plain text" };
}

/* ------------------------------------------------------------------ */
/* Per-kind readers                                                     */
/* ------------------------------------------------------------------ */

/** Read an uploaded artifact's bytes through the storage layer. */
async function artifactBytes(value: string): Promise<{
  bytes: Buffer;
  contentType: string;
} | null> {
  const key = artifactKeyForUrl(value);
  if (!key) return null;
  const fetched = await getArtifact(key);
  if (!fetched.ok || !fetched.bytes || !fetched.contentType) return null;
  return { bytes: fetched.bytes, contentType: fetched.contentType };
}

async function readImage(value: string): Promise<string> {
  const got = await artifactBytes(value);
  if (!got) {
    return "could not read: the image file is no longer in storage";
  }
  if (got.bytes.length > MAX_VISION_BYTES) {
    return `could not read: the image is ${Math.round(
      got.bytes.length / 1024 / 1024
    )} MB — larger than the 4 MB the vision reader accepts. Attach a smaller version.`;
  }
  const description = await describeImage(got.bytes, got.contentType);
  return description
    ? `read: ${cap(description, 800)}`
    : "could not read: the vision service failed on this image — describe it for me in text and I'll work from that";
}

async function readPdf(value: string): Promise<string> {
  const got = await artifactBytes(value);
  if (!got) {
    return "could not read: the PDF file is no longer in storage";
  }
  const text = pdfToText(got.bytes);
  return text
    ? `read: PDF text: ${cap(text)}`
    : "could not read: no extractable text in this PDF (it may be a scan or use embedded fonts) — paste the key points as text";
}

async function readUrl(value: string): Promise<string> {
  let result: { text: string; note: string } | null;
  try {
    result = await fetchUrlText(value);
  } catch (err) {
    return `could not read: fetching that URL failed (${
      err instanceof Error ? err.message : "network error"
    })`;
  }
  if (!result) {
    return "could not read: that URL is blocked (private, non-http, or malformed)";
  }
  if (!result.text) {
    return `could not read: ${result.note}`;
  }
  return `read: ${result.note} content: ${result.text}`;
}

async function readOne(attachment: RawAttachment): Promise<ReadAttachment> {
  switch (attachment.kind) {
    case "image":
      return { ...attachment, digest: await readImage(attachment.value) };
    case "pdf":
      return { ...attachment, digest: await readPdf(attachment.value) };
    case "url":
      return { ...attachment, digest: await readUrl(attachment.value) };
    case "video":
      return {
        ...attachment,
        digest:
          "kept for reference: I can't watch video yet — if specific moments matter, describe them in text and I'll build them in",
      };
    case "audio":
      return {
        ...attachment,
        digest:
          "kept for reference: I can't listen to audio yet — describe the track/mood you want, or I'll pick a silent cut",
      };
    default:
      return {
        ...attachment,
        digest: `could not read: unsupported attachment type "${attachment.kind}" — kept for reference only`,
      };
  }
}

/**
 * Read a batch of attachments. Every attachment resolves (failures become
 * honest notes); the whole call never rejects.
 */
export async function readAttachments(
  attachments: RawAttachment[]
): Promise<ReadAttachment[]> {
  return Promise.all(
    attachments.map(async (a) => {
      try {
        return await Promise.race([
          readOne(a),
          new Promise<ReadAttachment>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ...a,
                  digest: "could not read: reading this attachment took too long",
                }),
              PER_ATTACHMENT_TIMEOUT_MS
            )
          ),
        ]);
      } catch (err) {
        console.error(
          "[attachments] reader failed:",
          a.kind,
          err instanceof Error ? err.message : String(err)
        );
        return {
          ...a,
          digest: "could not read: an unexpected error while extracting this attachment",
        };
      }
    })
  );
}
