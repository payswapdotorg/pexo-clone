import ZAI from "z-ai-web-dev-sdk";
import { putArtifact } from "@/lib/storage";
import { DEFAULT_ASPECT, imageSizeFor } from "./aspect";

/* The sandbox SDK's size parameter is a literal union; our size table maps
   onto it exactly (1024x1024 · 768x1344 · 864x1152 · 1344x768 · 1152x864 ·
   1440x720 · 720x1440), so the cast only satisfies the compile-time shape. */
type SdkImageSize = Parameters<
  Awaited<ReturnType<typeof ZAI.create>>["images"]["generations"]["create"]
>[0]["size"];

function sdkImageSize(aspect: string): SdkImageSize {
  return imageSizeFor(aspect).replace("*", "x") as SdkImageSize;
}

export interface StillResult {
  url: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}

/**
 * Generate one still frame for the STILL_PREVIEW stage (deploy pass).
 *
 * Providers: DashScope wan text-to-image (public hosting) or the z-ai
 * sandbox SDK. The image is persisted through the storage abstraction
 * (R2 or local disk) and served from our own /api/artifacts/... path.
 * The raw bytes come back too — the render stage turns the still into the
 * first-frame input for the video model.
 */

const DEFAULT_DASHSCOPE_BASE = "https://dashscope-intl.aliyuncs.com";
const DEFAULT_IMAGE_MODEL = "wan2.2-t2i-flash";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 60; // ~2 minutes

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function dashscopeBase(): string {
  return (
    process.env.DASHSCOPE_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_DASHSCOPE_BASE
  );
}

function sniffImage(bytes: Buffer): "image/jpeg" | "image/png" {
  const isJpeg =
    bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return isJpeg ? "image/jpeg" : "image/png";
}

interface DashScopeTask {
  output?: {
    task_id?: string;
    task_status?: string;
    message?: string;
    results?: { url?: string }[];
  };
}

async function pollTask(taskId: string, headers: Record<string, string>) {
  for (let poll = 0; poll < MAX_POLLS; poll += 1) {
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(`${dashscopeBase()}/api/v1/tasks/${taskId}`, {
      headers,
      signal: AbortSignal.timeout(30_000),
    });
    const task = (await res.json().catch(() => null)) as DashScopeTask | null;
    const status = task?.output?.task_status;
    if (status === "SUCCEEDED") return task;
    if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
      throw new Error(
        `image task ${status}: ${task?.output?.message ?? "no detail"}`
      );
    }
  }
  throw new Error("image generation timed out");
}

async function generateWithDashScope(
  prompt: string,
  aspect: string
): Promise<Buffer> {
  const headers = {
    Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY as string}`,
    "Content-Type": "application/json",
  };
  const create = await fetch(
    `${dashscopeBase()}/api/v1/services/aigc/text2image/image-synthesis`,
    {
      method: "POST",
      headers: { ...headers, "X-DashScope-Async": "enable" },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL,
        input: { prompt },
        parameters: { size: imageSizeFor(aspect), n: 1 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  const created = (await create.json().catch(() => null)) as DashScopeTask | null;
  const taskId = created?.output?.task_id;
  if (!create.ok || !taskId) {
    const message =
      (created as unknown as { message?: string })?.message ??
      `HTTP ${create.status}`;
    throw new Error(`dashscope image: ${message}`);
  }

  const task = await pollTask(taskId, { Authorization: headers.Authorization });
  const url = task?.output?.results?.[0]?.url;
  if (typeof url !== "string" || !url) {
    throw new Error("image task succeeded but returned no url");
  }
  const download = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!download.ok) {
    throw new Error(`could not download the image (${download.status})`);
  }
  const bytes = Buffer.from(await download.arrayBuffer());
  if (bytes.length === 0) throw new Error("downloaded image was empty");
  return bytes;
}

async function generateWithZai(prompt: string, aspect: string): Promise<Buffer> {
  const zai = await ZAI.create();
  let response;
  try {
    response = await zai.images.generations.create({
      prompt,
      size: sdkImageSize(aspect),
    });
  } catch (err) {
    /* The sandbox gateway accepts a narrower size set than DashScope —
       fall back to the known-good default rather than failing the turn. */
    console.warn(
      "[image] sandbox size rejected, retrying with the default:",
      err instanceof Error ? err.message : String(err)
    );
    response = await zai.images.generations.create({
      prompt,
      size: sdkImageSize(DEFAULT_ASPECT),
    });
  }
  const base64: unknown = response?.data?.[0]?.base64;
  if (typeof base64 !== "string" || !base64) {
    throw new Error("image generation returned no data");
  }
  return Buffer.from(base64, "base64");
}

/**
 * Generate one still frame for the STILL_PREVIEW stage.
 *
 * `aspect` is the ratio agreed in the conversation (agent plan default or a
 * later user override); it selects the model size — the preview must show
 * the actual framing the render will use.
 */
export async function generateStill(
  projectId: string,
  prompt: string,
  aspect: string = DEFAULT_ASPECT
): Promise<StillResult> {
  const bytes = process.env.DASHSCOPE_API_KEY
    ? await generateWithDashScope(prompt, aspect)
    : await generateWithZai(prompt, aspect);

  /* Name the file after its actual format so the artifact route serves
     the right Content-Type (generators may emit JPEG for a .png contract). */
  const contentType = sniffImage(bytes);
  const filename = `still-${Date.now()}.${contentType === "image/jpeg" ? "jpg" : "png"}`;

  await putArtifact(`${projectId}/${filename}`, bytes, { contentType });

  return {
    url: `/api/artifacts/${projectId}/${filename}`,
    filename,
    contentType,
    bytes,
  };
}
