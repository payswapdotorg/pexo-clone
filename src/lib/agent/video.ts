import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import ZAI from "z-ai-web-dev-sdk";

const execFileAsync = promisify(execFile);

export interface VideoResult {
  url: string;
  filename: string;
  durationSec: 5;
  method: "sdk" | "ffmpeg";
  resolution: string;
}

const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 48; // ~4 minutes before the ffmpeg fallback kicks in

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function saveVideo(
  projectId: string,
  bytes: Buffer
): Promise<{ url: string; filename: string; absPath: string }> {
  const dir = path.join(process.cwd(), "data", "artifacts", projectId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `video-${Date.now()}.mp4`;
  const absPath = path.join(dir, filename);
  await fs.writeFile(absPath, bytes);
  return { url: `/api/artifacts/${projectId}/${filename}`, filename, absPath };
}

async function probeResolution(
  absPath: string,
  fallback: string
): Promise<string> {
  try {
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
        absPath,
      ],
      { timeout: 20_000 }
    );
    const [width, height] = stdout.trim().split(",");
    if (width && height) return `${width}x${height}`;
  } catch {
    /* keep the nominal resolution — probed value is a nice-to-have */
  }
  return fallback;
}

async function renderWithSdk(
  projectId: string,
  prompt: string,
  stillAbsPath: string | null
): Promise<VideoResult> {
  const zai = await ZAI.create();
  let image_url: string | undefined;
  if (stillAbsPath) {
    const still = await fs.readFile(stillAbsPath);
    /* Match the data-URI MIME to the actual bytes (SDK stills can be JPEG). */
    const isJpeg =
      still.length > 3 && still[0] === 0xff && still[1] === 0xd8 && still[2] === 0xff;
    image_url = `data:${isJpeg ? "image/jpeg" : "image/png"};base64,${still.toString("base64")}`;
  }

  const task = await zai.video.generations.create({
    prompt,
    image_url,
    quality: "speed",
    with_audio: false,
    size: "1344x768",
    fps: 30,
    duration: 5,
  });
  const taskId: unknown = task?.id;
  if (typeof taskId !== "string" || !taskId) {
    throw new Error("video generation returned no task id");
  }

  for (let poll = 0; poll < MAX_POLLS; poll += 1) {
    await sleep(POLL_INTERVAL_MS);
    const result = await zai.async.result.query(taskId);
    if (result?.task_status === "SUCCESS") {
      const remoteUrl: unknown = result?.video_result?.[0]?.url;
      if (typeof remoteUrl !== "string" || !remoteUrl) {
        throw new Error("video task succeeded but returned no url");
      }
      const response = await fetch(remoteUrl);
      if (!response.ok) {
        throw new Error(`could not download the rendered video (${response.status})`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) {
        throw new Error("rendered video was empty");
      }
      const saved = await saveVideo(projectId, bytes);
      return {
        url: saved.url,
        filename: saved.filename,
        durationSec: 5,
        method: "sdk",
        resolution: await probeResolution(saved.absPath, "1344x768"),
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
  stillAbsPath: string
): Promise<VideoResult> {
  const dir = path.join(process.cwd(), "data", "artifacts", projectId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `video-${Date.now()}.mp4`;
  const absPath = path.join(dir, filename);

  const filters =
    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2," +
    "zoompan=z='min(zoom+0.0008,1.08)':d=150:s=1280x720:fps=30,format=yuv420p";

  await execFileAsync(
    "/usr/bin/ffmpeg",
    [
      "-loop",
      "1",
      "-i",
      stillAbsPath,
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
      absPath,
    ],
    { timeout: 120_000 }
  );

  const stat = await fs.stat(absPath);
  if (stat.size === 0) {
    throw new Error("ffmpeg produced an empty file");
  }

  return {
    url: `/api/artifacts/${projectId}/${filename}`,
    filename,
    durationSec: 5,
    method: "ffmpeg",
    resolution: await probeResolution(absPath, "1280x720"),
  };
}

/**
 * Render the final video: SDK video generation first (polling the async
 * task), ffmpeg programmatic renderer from the still as an honest fallback.
 * Throws only when both paths fail.
 */
export async function renderVideo(
  projectId: string,
  prompt: string,
  stillAbsPath: string | null
): Promise<VideoResult> {
  try {
    return await renderWithSdk(projectId, prompt, stillAbsPath);
  } catch (err) {
    console.error(
      "[video] sdk render failed, using the ffmpeg fallback:",
      err instanceof Error ? err.message : String(err)
    );
    if (!stillAbsPath) {
      throw new Error("video rendering failed and no still frame exists to fall back on");
    }
    return renderWithFfmpeg(projectId, stillAbsPath);
  }
}
