import { db } from "@/lib/db";
import type { Message, Prisma } from "@prisma/client";

/**
 * Shared project helpers (PC2): title derivation kept from PC1, URL-shaped
 * project id allocation, and message appends with strictly monotonic
 * timestamps so conversation order is always well-defined in SQLite.
 */

export function deriveTitle(message: string): string {
  const firstLine = message.trim().split("\n")[0] ?? "";
  const cleaned = firstLine.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled project";
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned;
}

/** PC1 URL shape: seconds-epoch prefix + small sequence (e.g. 17922296961). */
export async function generateProjectId(): Promise<string> {
  const prefix = Math.floor(Date.now() / 1000).toString();
  for (let seq = 1; seq < 1000; seq += 1) {
    const id = `${prefix}${seq}`;
    const existing = await db.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return id;
  }
  throw new Error("could not allocate a project id");
}

export interface AppendMessageInput {
  role: "user" | "agent";
  markdown: string;
  stage?: string | null;
  attachments?: { kind: string; value: string }[] | null;
}

/**
 * Append a message, guaranteeing createdAt is strictly greater than the
 * project's current last message (SQLite ms precision + same-turn writes).
 * Also bumps the project's updatedAt so recent-projects sorts by activity.
 */
export async function appendMessage(
  projectId: string,
  input: AppendMessageInput
): Promise<Message> {
  const [last] = await db.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  const lastMs = last ? last.createdAt.getTime() : 0;
  const createdAt = new Date(Math.max(Date.now(), lastMs + 1));

  const message = await db.message.create({
    data: {
      projectId,
      role: input.role,
      markdown: input.markdown,
      stage: input.stage ?? null,
      attachments: (input.attachments ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      createdAt,
    },
  });
  await db.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });
  return message;
}

/** Absolute path of an artifact file from its /api/artifacts/... URL. */
export function artifactAbsPath(url: string): string | null {
  const prefix = "/api/artifacts/";
  if (!url.startsWith(prefix)) return null;
  const rel = url.slice(prefix.length);
  const segments = rel.split("/");
  const safe = segments.every(
    (segment) => /^[A-Za-z0-9._-]+$/.test(segment) && !segment.includes("..")
  );
  if (!safe || segments.length === 0) return null;
  return `${process.cwd()}/data/artifacts/${segments.join("/")}`;
}
