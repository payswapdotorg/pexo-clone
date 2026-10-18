import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { contentTypeFor, putArtifact } from "@/lib/storage";

/**
 * POST /api/uploads — multipart upload (one file, ≤8MB) stored via the
 * storage layer (R2 or local disk, see src/lib/storage.ts) and served back
 * through /api/artifacts/.
 */
const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED: Record<string, { kind: string }> = {
  ".pdf": { kind: "pdf" },
  ".png": { kind: "image" },
  ".jpg": { kind: "image" },
  ".jpeg": { kind: "image" },
  ".webp": { kind: "image" },
  ".gif": { kind: "image" },
  ".mp4": { kind: "video" },
  ".webm": { kind: "video" },
  ".mp3": { kind: "audio" },
  ".wav": { kind: "audio" },
};

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to upload files." },
      { status: 401 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be multipart form data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "invalid_file", message: "A file field is required." },
      { status: 400 }
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: "invalid_file",
        message: "File must be between 1 byte and 8MB.",
      },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  const allowed = ALLOWED[ext];
  if (!allowed) {
    return NextResponse.json(
      {
        error: "invalid_type",
        message:
          "Allowed types: pdf, png/jpg/webp/gif, mp4/webm, mp3/wav.",
      },
      { status: 400 }
    );
  }

  const sanitized = file.name
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^\.+/, "_")
    .slice(-80) || "file";
  const savedName = `upload-${Date.now()}-${sanitized}`;

  await putArtifact(`uploads/${savedName}`, Buffer.from(await file.arrayBuffer()), {
    contentType: contentTypeFor(savedName),
  });

  return NextResponse.json({
    url: `/api/artifacts/uploads/${savedName}`,
    filename: file.name,
    kind: allowed.kind,
  });
}
