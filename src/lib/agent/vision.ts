import ZAI from "z-ai-web-dev-sdk";
/**
 * describeImage — vision provider chain (attachments pass).
 *
 * Describes ONE image (raw bytes) in words so the text-only plan LLM can
 * use the actual attachment content. Mirrors askLLM's chain:
 *  1. OpenRouter    — OPENROUTER_API_KEY (vision-capable LLM_MODEL,
 *                    default gemini-2.5-flash; image sent as a data URL)
 *  2. DashScope     — DASHSCOPE_API_KEY (qwen-vl-plus by default,
 *                    DASHSCOPE_VISION_MODEL override; OpenAI-compatible
 *                    multimodal endpoint)
 *  3. z-ai sandbox  — z-ai-web-dev-sdk VLM (local/dev only)
 *
 * Returns null when every provider fails — the caller then writes an
 * honest "could not read" digest instead of failing the turn.
 */

const DEFAULT_DASHSCOPE_BASE = "https://dashscope-intl.aliyuncs.com";
const DEFAULT_DASHSCOPE_VISION_MODEL = "qwen-vl-plus";
const DEFAULT_OPENROUTER_VISION_MODEL = "google/gemini-2.5-flash";

/** Images larger than this are not sent to vision models (base64 inflates ~4/3). */
export const MAX_VISION_BYTES = 4 * 1024 * 1024;

const VISION_PROMPT = [
  "Describe this image precisely for a video-production agent:",
  "subject, composition, colors/mood, and any visible text, logo or UI",
  "(quote exact wording). Under 120 words. If the image is unreadable,",
  "say so in one sentence.",
].join(" ");

type VisionContent = Array<
  { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
>;

interface OpenAIVisionMessage {
  role: "user";
  content: VisionContent;
}

function visionMessages(dataUrl: string): OpenAIVisionMessage[] {
  return [
    {
      role: "user",
      content: [
        { type: "text", text: VISION_PROMPT },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ];
}

function extractContent(data: unknown): string | null {
  const content = (data as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return content.trim();
}

async function describeOpenRouter(dataUrl: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.VISION_MODEL ?? DEFAULT_OPENROUTER_VISION_MODEL,
      max_tokens: 400,
      messages: visionMessages(dataUrl),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(`openrouter vision: ${message}`);
  }
  const content = extractContent(data);
  if (!content) throw new Error("openrouter vision: empty response");
  return content;
}

async function describeDashScope(dataUrl: string): Promise<string> {
  const base = (
    process.env.DASHSCOPE_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_DASHSCOPE_BASE
  );
  const res = await fetch(`${base}/compatible-mode/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        process.env.DASHSCOPE_VISION_MODEL ?? DEFAULT_DASHSCOPE_VISION_MODEL,
      max_tokens: 400,
      messages: visionMessages(dataUrl),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new Error(`dashscope vision: ${message}`);
  }
  const content = extractContent(data);
  if (!content) throw new Error("dashscope vision: empty response");
  return content;
}

async function describeZai(dataUrl: string): Promise<string> {
  const zai = await ZAI.create();
  /* The SDK's official vision examples omit `model` (the gateway picks a
     default); its required-in-type field is satisfied via the assertion. */
  const body = {
    messages: visionMessages(dataUrl),
    thinking: { type: "disabled" },
  } as Parameters<typeof zai.chat.completions.createVision>[0];
  const completion = await zai.chat.completions.createVision(body);
  const content: unknown = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("vision returned an empty response");
  }
  return content.trim();
}

export async function describeImage(
  bytes: Buffer,
  contentType: string
): Promise<string | null> {
  if (bytes.length === 0) return null;
  if (bytes.length > MAX_VISION_BYTES) return null;
  const mime = contentType.split(";")[0].trim() || "image/png";
  const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;

  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await describeOpenRouter(dataUrl);
    } catch (err) {
      console.error(
        "[vision] openrouter failed, falling through:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }
  if (process.env.DASHSCOPE_API_KEY) {
    try {
      return await describeDashScope(dataUrl);
    } catch (err) {
      console.error(
        "[vision] dashscope failed, falling through:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }
  try {
    return await describeZai(dataUrl);
  } catch (err) {
    console.error(
      "[vision] z-ai failed:",
      err instanceof Error ? err.message : String(err)
    );
  }
  return null;
}
