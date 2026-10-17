import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { appendTurn } from "@/lib/store";

/**
 * POST /api/chat — send a chat message for a project (PRODUCT-SPEC §4).
 * PC1 scope: validates the body, requires a session, appends the user
 * message plus the stub PLAN_QUESTIONS turn. PC2 replaces the stub with the
 * real agent brain (AGENT-PROTOCOL stage machine).
 */
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

  const { projectId, message, attachments } = (body ?? {}) as {
    projectId?: unknown;
    message?: unknown;
    attachments?: unknown;
  };

  if (message === undefined || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "invalid_message", message: "message must be a non-empty string." },
      { status: 400 }
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "invalid_message", message: "message must be at most 2000 chars." },
      { status: 400 }
    );
  }
  if (projectId !== undefined && projectId !== null && typeof projectId !== "string") {
    return NextResponse.json(
      { error: "invalid_project_id", message: "projectId must be a string or null." },
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

  const result = await appendTurn({
    projectId: projectId ?? null,
    message,
    attachments: parsedAttachments,
  });

  if (result === null) {
    return NextResponse.json(
      { error: "project_not_found", message: "That project does not exist." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    projectId: result.project.id,
    title: result.project.title,
    turn: result.turn,
  });
}
