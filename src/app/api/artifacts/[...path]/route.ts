import { NextResponse } from "next/server";
import { getArtifact } from "@/lib/storage";

/**
 * GET /api/artifacts/[...path] — serves stored artifacts (R2 or local disk,
 * see src/lib/storage.ts) with single-range HTTP Range support so video
 * seeking works in the browser players. Keys are validated + traversal-
 * checked before they ever reach the storage layer.
 */
export const dynamic = "force-dynamic";

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

  const key = decoded.join("/");
  const fetched = await getArtifact(key, request.headers.get("range"));
  if (!fetched.ok || !fetched.bytes || !fetched.contentType) {
    return notFound();
  }

  if (fetched.unsatisfiable) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${fetched.size ?? 0}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  const size = fetched.size ?? fetched.bytes.length;

  if (fetched.status === 206 && fetched.contentRange) {
    return new NextResponse(new Uint8Array(fetched.bytes), {
      status: 206,
      headers: {
        "Content-Type": fetched.contentType,
        "Content-Length": String(fetched.bytes.length),
        "Content-Range": fetched.contentRange,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(new Uint8Array(fetched.bytes), {
    status: 200,
    headers: {
      "Content-Type": fetched.contentType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
