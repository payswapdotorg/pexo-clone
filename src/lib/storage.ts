import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";

/**
 * Artifact storage abstraction (deploy pass).
 *
 * Two interchangeable modes, selected purely by environment:
 *  - "r2"   — Cloudflare R2 (S3-compatible) via SigV4 (aws4fetch). Used on
 *             serverless hosting where the filesystem is ephemeral. Activates
 *             when R2_BUCKET + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY +
 *             R2_ENDPOINT are all present.
 *  - "disk" — data/artifacts/ on local disk (the sandbox / local dev default).
 *
 * The public contract everywhere is the artifact URL path
 * /api/artifacts/{key} — the key shape (projectId/filename, uploads/...)
 * is identical in both modes, so the DB rows never change.
 */

export type StorageMode = "disk" | "r2";

const DISK_ROOT = path.join(process.cwd(), "data", "artifacts");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

export function contentTypeFor(filename: string): string {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
}

export function storageMode(): StorageMode {
  const { R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT } =
    process.env;
  return R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT
    ? "r2"
    : "disk";
}

/* ------------------------------------------------------------------ */
/* Key helpers                                                          */
/* ------------------------------------------------------------------ */

const SEGMENT_RE = /^[A-Za-z0-9._-]+$/;

/** Validate a storage key ("{projectId}/{filename}" or "uploads/{filename}"). */
export function safeKey(key: string): string | null {
  const segments = key.split("/");
  if (segments.length === 0) return null;
  const ok = segments.every(
    (segment) => SEGMENT_RE.test(segment) && !segment.includes("..")
  );
  return ok ? segments.join("/") : null;
}

/** Storage key from an artifact URL (/api/artifacts/{key} → key). */
export function artifactKeyForUrl(url: string): string | null {
  const prefix = "/api/artifacts/";
  if (!url.startsWith(prefix)) return null;
  return safeKey(url.slice(prefix.length));
}

/* ------------------------------------------------------------------ */
/* R2 client                                                            */
/* ------------------------------------------------------------------ */

let r2Client: AwsClient | null = null;

function r2(): AwsClient {
  if (!r2Client) {
    r2Client = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      service: "s3",
      region: "auto",
    });
  }
  return r2Client;
}

function objectUrl(key: string): string {
  const endpoint = (process.env.R2_ENDPOINT as string).replace(/\/$/, "");
  const bucket = process.env.R2_BUCKET as string;
  return `${endpoint}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/* ------------------------------------------------------------------ */
/* Put / get / delete                                                   */
/* ------------------------------------------------------------------ */

export async function putArtifact(
  key: string,
  bytes: Buffer,
  options: { contentType?: string } = {}
): Promise<void> {
  const safe = safeKey(key);
  if (!safe) throw new Error(`unsafe artifact key: ${key}`);

  if (storageMode() === "r2") {
    /* Pre-signed URL + plain fetch: aws4fetch's own fetch wrapper loses
       Content-Length on large bodies under Next's patched fetch (R2 → 411
       MissingContentLength), while a string-URL fetch keeps undici's
       known-length handling intact at every size (proven empirically:
       150KB / 700KB / 1.5MB all 200). */
    const contentType = options.contentType ?? contentTypeFor(safe);
    const signed = await r2().sign(
      new Request(objectUrl(safe), { method: "PUT" }),
      { aws: { signQuery: true } }
    );
    const res = await fetch(signed.url, {
      method: "PUT",
      body: new Uint8Array(bytes),
      headers: { "Content-Type": contentType },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `R2 put failed (${res.status}): ${safe} :: ${detail.slice(0, 400)}`
      );
    }
    return;
  }

  const abs = path.join(DISK_ROOT, safe);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, bytes);
}

export interface ArtifactFetch {
  ok: boolean;
  /** Range present but not satisfiable (start >= size) → 416. */
  unsatisfiable?: boolean;
  status?: 200 | 206;
  bytes?: Buffer;
  contentType?: string;
  /** Total object size in bytes. */
  size?: number;
  contentRange?: string;
}

/**
 * Fetch an artifact, optionally with an HTTP Range header (single range,
 * "bytes=start-end" syntax). Returns { ok: false } when the object does not
 * exist. R2 mode forwards the range to S3 (native 206 support); disk mode
 * slices locally with identical semantics.
 */
export async function getArtifact(
  key: string,
  range?: string | null
): Promise<ArtifactFetch> {
  const safe = safeKey(key);
  if (!safe) return { ok: false };

  if (storageMode() === "r2") {
    let res: Response;
    try {
      res = await r2().fetch(objectUrl(safe), {
        method: "GET",
        headers: range ? { Range: range } : undefined,
      });
    } catch {
      return { ok: false };
    }
    if (res.status === 404 || res.status === 403) return { ok: false };
    if (res.status === 416) {
      const total = res.headers.get("content-range")?.match(/\/(\d+)$/);
      return { ok: true, unsatisfiable: true, size: total ? parseInt(total[1], 10) : 0 };
    }
    if (res.status !== 200 && res.status !== 206) return { ok: false };

    const bytes = Buffer.from(await res.arrayBuffer());
    const contentType =
      res.headers.get("content-type") ?? contentTypeFor(safe);
    const contentRange = res.headers.get("content-range") ?? undefined;
    const size = contentRange?.match(/\/(\d+)$/);
    return {
      ok: true,
      status: res.status === 206 ? 206 : 200,
      bytes,
      contentType: contentType.split(";")[0].trim() || contentTypeFor(safe),
      size: size ? parseInt(size[1], 10) : bytes.length,
      contentRange,
    };
  }

  const abs = path.join(DISK_ROOT, safe);
  let bytes: Buffer;
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return { ok: false };
    bytes = await fs.readFile(abs);
  } catch {
    return { ok: false };
  }

  const size = bytes.length;
  const contentType = contentTypeFor(safe);

  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end)) end = size - 1;
      if (start > end || start >= size) {
        return { ok: true, unsatisfiable: true, size };
      }
      end = Math.min(end, size - 1);
      return {
        ok: true,
        status: 206,
        bytes: bytes.subarray(start, end + 1),
        contentType,
        size,
        contentRange: `bytes ${start}-${end}/${size}`,
      };
    }
  }

  return { ok: true, status: 200, bytes, contentType, size };
}

/** Best-effort delete of one artifact object/file. */
export async function deleteArtifact(urlOrKey: string | null): Promise<void> {
  if (!urlOrKey) return;
  const key = urlOrKey.startsWith("/api/artifacts/")
    ? artifactKeyForUrl(urlOrKey)
    : safeKey(urlOrKey);
  if (!key) return;

  if (storageMode() === "r2") {
    await r2()
      .fetch(objectUrl(key), { method: "DELETE" })
      .catch(() => undefined);
    return;
  }
  await fs.rm(path.join(DISK_ROOT, key), { force: true }).catch(() => undefined);
}

/** Delete every artifact object listed under a project id prefix. */
export async function deleteProjectArtifacts(projectId: string): Promise<void> {
  if (!SEGMENT_RE.test(projectId) || projectId.includes("..")) return;

  if (storageMode() === "r2") {
    // List by prefix, then delete in batches of 1000 (S3 multi-delete).
    const endpoint = (process.env.R2_ENDPOINT as string).replace(/\/$/, "");
    const bucket = process.env.R2_BUCKET as string;
    let cursor: string | undefined;
    const keys: string[] = [];

    for (let page = 0; page < 20; page += 1) {
      const query = new URLSearchParams({
        "list-type": "2",
        prefix: `${projectId}/`,
      });
      if (cursor) query.set("continuation-token", cursor);
      const res = await r2().fetch(`${endpoint}/${bucket}?${query.toString()}`);
      if (!res.ok) break;
      const xml = await res.text();
      keys.push(
        ...Array.from(xml.matchAll(/<Key>([^<]+)<\/Key>/g)).map((m) =>
          decodeURIComponent(m[1])
        )
      );
      const next = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
      if (!next) break;
      cursor = next[1];
    }

    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      const body = `<?xml version="1.0" encoding="UTF-8"?><Delete>${batch
        .map(
          (k) =>
            `<Object><Key>${k
              .split("/")
              .map(encodeURIComponent)
              .join("/")}</Key></Object>`
        )
        .join("")}</Delete>`;
      const md5 = createHash("md5").update(body).digest("base64");
      await r2()
        .fetch(`${endpoint}/${bucket}?delete`, {
          method: "POST",
          body,
          headers: {
            "Content-Type": "application/xml",
            "Content-MD5": md5,
          },
        })
        .catch(() => undefined);
    }
    return;
  }

  await fs
    .rm(path.join(DISK_ROOT, projectId), { recursive: true, force: true })
    .catch(() => undefined);
}
