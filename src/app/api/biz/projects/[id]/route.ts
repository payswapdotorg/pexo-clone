import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { deleteProjectArtifacts } from "@/lib/storage";

/**
 * GET /api/biz/projects/[id] — full project detail for the project page
 * (messages with per-message artifacts via the messageId join, all
 * artifacts, latest feedback, current credits).
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to view projects." },
      { status: 401 }
    );
  }
  const { id } = await ctx.params;

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found", message: "That project does not exist." },
      { status: 404 }
    );
  }

  const [messages, artifacts, feedback] = await Promise.all([
    db.message.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    db.artifact.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    db.feedback.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byMessage = new Map<string, typeof artifacts>();
  for (const artifact of artifacts) {
    if (!artifact.messageId) continue;
    const list = byMessage.get(artifact.messageId) ?? [];
    list.push(artifact);
    byMessage.set(artifact.messageId, list);
  }

  const serializeArtifact = (artifact: (typeof artifacts)[number]) => ({
    id: artifact.id,
    kind: artifact.kind,
    url: artifact.url,
    filename: artifact.filename,
    durationSec: artifact.durationSec,
    createdAt: artifact.createdAt.toISOString(),
  });

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      status: project.status,
      confirmPolicy: project.confirmPolicy,
      publicId: project.publicId,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      markdown: message.markdown,
      stage: message.stage,
      attachments: message.attachments,
      createdAt: message.createdAt.toISOString(),
      artifacts: (byMessage.get(message.id) ?? []).map(serializeArtifact),
    })),
    artifacts: artifacts.map(serializeArtifact),
    feedback: feedback
      ? {
          id: feedback.id,
          rating: feedback.rating,
          note: feedback.note,
          createdAt: feedback.createdAt.toISOString(),
        }
      : null,
    credits: user.credits,
  });
}

/** PATCH /api/biz/projects/[id] — rename (title 1..80 chars). */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to edit projects." },
      { status: 401 }
    );
  }
  const { id } = await ctx.params;

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found", message: "That project does not exist." },
      { status: 404 }
    );
  }

  let title: unknown;
  try {
    const body = (await request.json()) as { title?: unknown };
    title = body.title;
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be JSON." },
      { status: 400 }
    );
  }
  if (typeof title !== "string" || !title.trim() || title.trim().length > 80) {
    return NextResponse.json(
      {
        error: "invalid_title",
        message: "title must be a non-empty string of at most 80 chars.",
      },
      { status: 400 }
    );
  }

  const updated = await db.project.update({
    where: { id: project.id },
    data: { title: title.trim() },
  });
  return NextResponse.json({
    project: {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      confirmPolicy: updated.confirmPolicy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

/**
 * DELETE /api/biz/projects/[id] — delete the project and its dependent
 * rows (messages, artifacts, feedbacks, project events; credit events stay
 * as financial history) plus a best-effort delete of the artifact files.
 */
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to delete projects." },
      { status: 401 }
    );
  }
  const { id } = await ctx.params;

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found", message: "That project does not exist." },
      { status: 404 }
    );
  }

  await db.$transaction([
    db.artifact.deleteMany({ where: { projectId: project.id } }),
    db.message.deleteMany({ where: { projectId: project.id } }),
    db.feedback.deleteMany({ where: { projectId: project.id } }),
    db.projectEvent.deleteMany({ where: { projectId: project.id } }),
    db.project.delete({ where: { id: project.id } }),
  ]);

  await deleteProjectArtifacts(project.id);

  return NextResponse.json({ ok: true, deleted: project.id });
}
