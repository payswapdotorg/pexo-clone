import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * POST /api/biz/projects/[id]/share — owner-controlled public sharing
 * (PRODUCT-SPEC §6.8 share honesty).
 *
 * The old share menu copied the *session-scoped* project URL, which only
 * ever worked for the owner — every other visitor hit "This scene doesn't
 * exist". Sharing is now a real, opt-in capability: the owner creates an
 * unguessable public id, /share/<publicId> renders a read-only view, and
 * revoking (or deleting the project) kills the link immediately.
 *
 * action "create" → fresh id every call (rotate = create again).
 * action "revoke" → null (existing links 404 from that moment).
 */
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function newPublicId(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to manage sharing." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found", message: "That project does not exist." },
      { status: 404 }
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
  const { action } = (body ?? {}) as { action?: unknown };
  if (action !== "create" && action !== "revoke") {
    return NextResponse.json(
      {
        error: "invalid_action",
        message: 'action must be "create" or "revoke".',
      },
      { status: 400 }
    );
  }

  if (action === "revoke") {
    await db.project.update({
      where: { id: project.id },
      data: { publicId: null },
    });
    return NextResponse.json({ publicId: null });
  }

  /* create (also rotates an existing id — old links stop working) */
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const publicId = newPublicId();
    try {
      await db.project.update({ where: { id: project.id }, data: { publicId } });
      return NextResponse.json({ publicId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Unique constraint") && attempt < 2) continue;
      throw err;
    }
  }
  throw new Error("unreachable: public id generation exhausted retries");
}
