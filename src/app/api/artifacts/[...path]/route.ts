import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * GET /api/artifacts/[...path] — serves files under data/artifacts/ only
 * (resolved + prefix-checked to block traversal), with single-range HTTP
 * Range support so video seeking works in the browser players.
 */
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), "data", "artifacts");

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

function notFound(): NextResponse {
  return NextResponse.json(
    { error: "not_found", message: "No such artifact." },
    { status: 404 }
  );
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await ctx.params;
  const decoded = segments.map((segment) => decodeURIComponent(segment));

  if (
    decoded.length === 0 ||
    decoded.some(
      (segment) =>
        !segment ||
        !/^[A-Za-z0-9._-]+$/.test(segment) ||
        segment.includes("..")
    )
  ) {
    return notFound();
  }

  const rel = decoded.join("/");
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(`${ROOT}${path.sep}`)) {
    return notFound();
  }

  let bytes: Buffer;
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return notFound();
    bytes = await fs.readFile(abs);
  } catch {
    return notFound();
  }

  const contentType =
    CONTENT_TYPES[path.extname(abs).toLowerCase()] ??
    "application/octet-stream";
  const size = bytes.length;

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end)) end = size - 1;
      if (start > end || start >= size) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${size}`,
            "Accept-Ranges": "bytes",
          },
        });
      }
      end = Math.min(end, size - 1);
      return new NextResponse(new Uint8Array(bytes.subarray(start, end + 1)), {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
