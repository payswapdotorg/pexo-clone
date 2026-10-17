import { promises as fs } from "node:fs";
import path from "node:path";
import ZAI from "z-ai-web-dev-sdk";

export interface StillResult {
  url: string;
  filename: string;
  absPath: string;
}

/**
 * Generate one still frame for the STILL_PREVIEW stage and persist it under
 * data/artifacts/{projectId}/. The URL is our own /api/artifacts/... path.
 */
export async function generateStill(
  projectId: string,
  prompt: string
): Promise<StillResult> {
  const zai = await ZAI.create();
  const response = await zai.images.generations.create({
    prompt,
    size: "1344x768",
  });
  const base64: unknown = response?.data?.[0]?.base64;
  if (typeof base64 !== "string" || !base64) {
    throw new Error("image generation returned no data");
  }

  const dir = path.join(process.cwd(), "data", "artifacts", projectId);
  await fs.mkdir(dir, { recursive: true });

  const bytes = Buffer.from(base64, "base64");
  /* The SDK may return JPEG bytes regardless of the .png contract — name the
     file after its actual format so the artifact route serves the right
     Content-Type. */
  const isJpeg =
    bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const filename = `still-${Date.now()}.${isJpeg ? "jpg" : "png"}`;
  const absPath = path.join(dir, filename);
  await fs.writeFile(absPath, bytes);

  return { url: `/api/artifacts/${projectId}/${filename}`, filename, absPath };
}
