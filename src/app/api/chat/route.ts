import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  appendMessage,
  deriveTitle,
  generateProjectId,
} from "@/lib/projects";
import { runAgentTurn } from "@/lib/agent/protocol";
import { emitMessageCreated } from "@/lib/agent/events";

/**
 * POST /api/chat — send a chat message for a project (PRODUCT-SPEC §4).
 * PC2: the real agent brain. Appends the user message, runs the
 * AGENT-PROTOCOL stage machine, and returns the agent turn. A project
 * created this call is rolled back entirely if generation fails.
 */
const CONFIRM_POLICIES = new Set(["large_costs", "always", "never"]);

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to start a project." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be JSON." },
      { status: 400 }
    );
  }

  const { projectId, message, attachments, confirmPolicy } = (body ?? {}) as {
    projectId?: unknown;
    message?: unknown;
    attachments?: unknown;
    confirmPolicy?: unknown;
  };

  const text = typeof message === "string" ? message.trim() : "";
  if (!text || text.length > 2000) {
    return NextResponse.json(
      {
        error: "invalid_message",
        message: "message must be a non-empty string of at most 2000 chars.",
      },
      { status: 400 }
    );
  }
  if (projectId !== undefined && projectId !== null && typeof projectId !== "string") {
    return NextResponse.json(
      { error: "invalid_project_id", message: "projectId must be a string or null." },
      { status: 400 }
    );
  }
  if (
    confirmPolicy !== undefined &&
    confirmPolicy !== null &&
    (typeof confirmPolicy !== "string" || !CONFIRM_POLICIES.has(confirmPolicy))
  ) {
    return NextResponse.json(
      {
        error: "invalid_confirm_policy",
        message: 'confirmPolicy must be "large_costs", "always" or "never".',
      },
      { status: 400 }
    );
  }

  let parsedAttachments: { kind: string; value: string }[] | undefined;
  if (attachments !== undefined && attachments !== null) {
    if (
      !Array.isArray(attachments) ||
      attachments.length > 8 ||
      !attachments.every(
        (a) =>
          a !== null &&
          typeof a === "object" &&
          typeof (a as { kind?: unknown }).kind === "string" &&
          typeof (a as { value?: unknown }).value === "string"
      )
    ) {
      return NextResponse.json(
        {
          error: "invalid_attachments",
          message: "attachments must be up to 8 {kind, value} strings.",
        },
        { status: 400 }
      );
    }
    parsedAttachments = attachments.map((a) => ({
      kind: (a as { kind: string }).kind.slice(0, 16),
      value: (a as { value: string }).value.slice(0, 500),
    }));
  }

  let project;
  let created = false;
  if (projectId) {
    project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== user.id) {
      return NextResponse.json(
        { error: "project_not_found", message: "That project does not exist." },
        { status: 404 }
      );
    }
  } else {
    const id = await generateProjectId();
    project = await db.project.create({
      data: {
        id,
        title: deriveTitle(text),
        confirmPolicy:
          typeof confirmPolicy === "string" ? confirmPolicy : "always",
        status: "working",
        userId: user.id,
      },
    });
    created = true;
  }

  const chips = (parsedAttachments ?? [])
    .map((a) => `[attached ${a.kind}: ${a.value}]`)
    .join(" ");
  const userMarkdown = chips ? `${text}\n\n${chips}` : text;
  const userMessage = await appendMessage(project.id, {
    role: "user",
    markdown: userMarkdown,
    attachments: parsedAttachments ?? [],
  });
  await emitMessageCreated(project.id, userMessage);

  try {
    const turn = await runAgentTurn(user, project, text, parsedAttachments ?? []);
    return NextResponse.json({
      projectId: project.id,
      title: project.title,
      turn: {
        stage: turn.stage,
        markdown: turn.markdown,
        ...(turn.blocked ? { blocked: turn.blocked } : {}),
      },
      artifacts: turn.artifacts,
      credits: turn.credits,
      status: turn.status,
    });
  } catch (err) {
    console.error(
      "[chat] agent turn failed:",
      err instanceof Error ? err.message : String(err)
    );
    if (created) {
      // Transactional rollback of the whole freshly-created project.
      await db.projectEvent.deleteMany({ where: { projectId: project.id } });
      await db.artifact.deleteMany({ where: { projectId: project.id } });
      await db.message.deleteMany({ where: { projectId: project.id } });
      await db.creditEvent.deleteMany({ where: { projectId: project.id } });
      await db.project.delete({ where: { id: project.id } });
      await fs
        .rm(path.join(process.cwd(), "data", "artifacts", project.id), {
          recursive: true,
          force: true,
        })
        .catch(() => undefined);
    }
    return NextResponse.json(
      {
        error: "generation_failed",
        message:
          "The agent could not complete this step — nothing was charged. Try sending it again.",
      },
      { status: 502 }
    );
  }
}
