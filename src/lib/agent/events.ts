import { db } from "@/lib/db";
import type { Artifact, Message, Prisma } from "@prisma/client";

/**
 * ProjectEvent emitters — the rows that power the long-poll
 * /api/biz/web-push/events stream (live agent status for the client).
 */
export type ProjectEventType =
  | "message.created"
  | "artifact.created"
  | "project.status"
  | "credits.updated";

async function emit(
  projectId: string,
  type: ProjectEventType,
  payload: Prisma.InputJsonValue
): Promise<void> {
  await db.projectEvent.create({ data: { projectId, type, payload } });
}

export async function emitMessageCreated(
  projectId: string,
  message: Message
): Promise<void> {
  await emit(projectId, "message.created", {
    messageId: message.id,
    role: message.role,
    stage: message.stage ?? null,
  });
}

export async function emitArtifactCreated(
  projectId: string,
  artifact: Artifact
): Promise<void> {
  await emit(projectId, "artifact.created", {
    artifactId: artifact.id,
    kind: artifact.kind,
    url: artifact.url,
    filename: artifact.filename,
    durationSec: artifact.durationSec ?? null,
  });
}

export async function emitProjectStatus(
  projectId: string,
  status: string
): Promise<void> {
  await emit(projectId, "project.status", { status });
}

export async function emitCreditsUpdated(
  projectId: string,
  credits: number
): Promise<void> {
  await emit(projectId, "credits.updated", { credits });
}
