import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import ZAI from "z-ai-web-dev-sdk";
import { putArtifact } from "@/lib/storage";
import { DEFAULT_ASPECT, ffmpegTargetFor, videoSdkSizeFor, videoSizeFor } from "./aspect";

const execFileAsync = promisify(execFile);

export interface VideoResult {
  url: string;
  filename: string;
  durationSec: 5;
  method: "sdk" | "ffmpeg";
  resolution: string;
}

/** The still frame handed to the render stage (bytes + real MIME type). */
export interface StillSource {
  contentType: string;
  bytes: Buffer;
}

const DEFAULT_DASHSCOPE_BASE = "https://dashscope-intl.aliyuncs.com";
const DEFAULT_VIDEO_MODEL = "wan2.1-t2v-turbo";

const SDK_POLL_INTERVAL_MS = 5_000;
const SDK_MAX_POLLS = 48; // ~4 minutes before the ffmpeg fallback kicks in
const DASH_POLL_INTERVAL_MS = 5_000;
const DASH_MAX_POLLS = 48; // ~4 minutes (wan turbo renders land ~2 min)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function dashscopeBase(): string {
  return (
    process.env.DASHSCOPE_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_DASHSCOPE_BASE
  );
}

async function probeResolutionBytes(
  bytes: Buffer,
  fallback: string
): Promise<string> {
  /* ffprobe is optional (absent on serverless) — the nominal resolution is
     the honest fallback. */
  const probePath = path.join(tmpdir(), `pexo-probe-${Date.now()}.mp4`);
  try {
    await fs.writeFile(probePath, bytes);
    const { stdout } = await execFileAsync(
      "/usr/bin/ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0",
        probePath,
      ],
      { timeout: 20_000 }
    );
    const [width, height] = stdout.trim().split(",");
    if (width && height) return `${width}x${height}`;
  } catch {
    /* keep the nominal resolution */
  } finally {
    await fs.rm(probePath, { force: true }).catch(() => undefined);
  }
  return fallback;
}

/* ------------------------------------------------------------------ */
/* DashScope (public hosting) — wan video synthesis, async task          */
/* ------------------------------------------------------------------ */

interface DashScopeVideoTask {
  output?: {
    task_id?: string;
    task_status?: string;
    message?: string;
    video_url?: string;
    usage?: { video_ratio?: string; video_duration?: number };
  };
}

async function renderWithDashScope(
  projectId: string,
  prompt: string,
  still: StillSource | null,
  aspect: string
): Promise<VideoResult> {
  const auth = `Bearer ${process.env.DASHSCOPE_API_KEY as string}`;
  const input: Record<string, unknown> = { prompt };
  if (still) {
    input.img_url = `data:${still.contentType};base64,${still.bytes.toString("base64")}`;
  }

  const create = await fetch(
    `${dashscopeBase()}/api/v1/services/aigc/video-generation/video-synthesis`,
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_VIDEO_MODEL ?? DEFAULT_VIDEO_MODEL,
        input,
        parameters: { size: videoSizeFor(aspect), duration: 5 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  const created = (await create.json().catch(() => null)) as DashScopeVideoTask | null;
  const taskId = created?.output?.task_id;
  if (!create.ok || !taskId) {
    const message =
      (created as unknown as { message?: string })?.message ??
      `HTTP ${create.status}`;
    throw new Error(`dashscope video: ${message}`);
  }

  for (let poll = 0; poll < DASH_MAX_POLLS; poll += 1) {
    await sleep(DASH_POLL_INTERVAL_MS);
    const res = await fetch(`${dashscopeBase()}/api/v1/tasks/${taskId}`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(30_000),
    });
    const task = (await res.json().catch(() => null)) as DashScopeVideoTask | null;
    const status = task?.output?.task_status;
    if (status === "SUCCEEDED") {
      const remoteUrl = task?.output?.video_url;
      if (typeof remoteUrl !== "string" || !remoteUrl) {
        throw new Error("video task succeeded but returned no url");
      }
      const download = await fetch(remoteUrl, {
        signal: AbortSignal.timeout(120_000),
      });
      if (!download.ok) {
        throw new Error(`could not download the rendered video (${download.status})`);
      }
      const bytes = Buffer.from(await download.arrayBuffer());
      if (bytes.length === 0) {
        throw new Error("rendered video was empty");
      }
      const filename = `video-${Date.now()}.mp4`;
      await putArtifact(`${projectId}/${filename}`, bytes, {
        contentType: "video/mp4",
      });
      const ratio = task?.output?.usage?.video_ratio;
      return {
        url: `/api/artifacts/${projectId}/${filename}`,
        filename,
        durationSec: 5,
        method: "sdk",
        resolution: ratio ? ratio.replace("*", "x") : videoSizeFor(aspect).replace("*", "x"),
      };
    }
    if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
      throw new Error(
        `video task ${status}: ${task?.output?.message ?? "no detail"}`
      );
    }
  }
  throw new Error("video generation timed out");
}

/* ------------------------------------------------------------------ */
/* z-ai sandbox SDK + ffmpeg fallback (local/sandbox mode)              */
/* ------------------------------------------------------------------ */

async function renderWithSdk(
  projectId: string,
  prompt: string,
  still: StillSource | null,
  aspect: string
): Promise<VideoResult> {
  const zai = await ZAI.create();
  let image_url: string | undefined;
  if (still) {
    image_url = `data:${still.contentType};base64,${still.bytes.toString("base64")}`;
  }

  const task = await zai.video.generations.create({
    prompt,
    image_url,
    quality: "speed",
    with_audio: false,
    size: videoSdkSizeFor(aspect),
    fps: 30,
    duration: 5,
  });
  const taskId: unknown = task?.id;
  if (typeof taskId !== "string" || !taskId) {
    throw new Error("video generation returned no task id");
  }

  for (let poll = 0; poll < SDK_MAX_POLLS; poll += 1) {
    await sleep(SDK_POLL_INTERVAL_MS);
    const result = await zai.async.result.query(taskId);
    if (result?.task_status === "SUCCESS") {
      const remoteUrl: unknown = result?.video_result?.[0]?.url;
      if (typeof remoteUrl !== "string" || !remoteUrl) {
        throw new Error("video task succeeded but returned no url");
      }
      const response = await fetch(remoteUrl, {
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) {
        throw new Error(`could not download the rendered video (${response.status})`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) {
        throw new Error("rendered video was empty");
      }
      const filename = `video-${Date.now()}.mp4`;
      await putArtifact(`${projectId}/${filename}`, bytes, {
        contentType: "video/mp4",
      });
      return {
        url: `/api/artifacts/${projectId}/${filename}`,
        filename,
        durationSec: 5,
        method: "sdk",
        resolution: await probeResolutionBytes(bytes, videoSdkSizeFor(aspect)),
      };
    }
    if (result?.task_status === "FAIL") {
      throw new Error("video generation task failed");
    }
  }
  throw new Error("video generation timed out");
}

async function renderWithFfmpeg(
  projectId: string,
  still: StillSource,
  aspect: string
): Promise<VideoResult> {
  const stillPath = path.join(tmpdir(), `pexo-still-${Date.now()}`);
  await fs.writeFile(stillPath, still.bytes);

  const outPath = path.join(tmpdir(), `pexo-video-${Date.now()}.mp4`);
  const target = ffmpegTargetFor(aspect);
  const sizeFlag = `${target.width}x${target.height}`;
  const filters =
    `scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease,` +
    `pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2,` +
    `zoompan=z='min(zoom+0.0008,1.08)':d=150:s=${sizeFlag}:fps=30,format=yuv420p`;

  try {
    await execFileAsync(
      "/usr/bin/ffmpeg",
      [
        "-loop",
        "1",
        "-i",
        stillPath,
        "-t",
        "5",
        "-vf",
        filters,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-movflags",
        "+faststart",
        "-y",
        outPath,
      ],
      { timeout: 120_000 }
    );

    const bytes = await fs.readFile(outPath);
    if (bytes.length === 0) {
      throw new Error("ffmpeg produced an empty file");
    }
    const filename = `video-${Date.now()}.mp4`;
    await putArtifact(`${projectId}/${filename}`, bytes, {
      contentType: "video/mp4",
    });
    return {
      url: `/api/artifacts/${projectId}/${filename}`,
      filename,
      durationSec: 5,
      method: "ffmpeg",
      resolution: await probeResolutionBytes(bytes, sizeFlag),
    };
  } finally {
    await fs.rm(stillPath, { force: true }).catch(() => undefined);
    await fs.rm(outPath, { force: true }).catch(() => undefined);
  }
}

/**
 * Render the final video (deploy pass): DashScope wan model on public
 * hosting; z-ai SDK with the honest ffmpeg programmatic fallback in the
 * sandbox. `aspect` is the ratio agreed in the conversation — the render
 * size is chosen from it (video model: 1280x720, 720x1280 or 960x960).
 * Throws only when the active paths fail (the caller rolls the credit
 * spend back).
 */
export async function renderVideo(
  projectId: string,
  prompt: string,
  still: StillSource | null,
  aspect: string = DEFAULT_ASPECT
): Promise<VideoResult> {
  if (process.env.DASHSCOPE_API_KEY) {
    return renderWithDashScope(projectId, prompt, still, aspect);
  }

  try {
    return await renderWithSdk(projectId, prompt, still, aspect);
  } catch (err) {
    console.error(
      "[video] sdk render failed, using the ffmpeg fallback:",
      err instanceof Error ? err.message : String(err)
    );
    if (!still) {
      throw new Error("video rendering failed and no still frame exists to fall back on");
    }
    return renderWithFfmpeg(projectId, still, aspect);
  }
}
