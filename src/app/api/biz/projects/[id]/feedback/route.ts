import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * POST /api/biz/projects/[id]/feedback — persist the Good/Okay/Bad rating
 * (AGENT-PROTOCOL S6). Persist-only per the PC2 scope: no auto-ack turn.
 */
const RATINGS = new Set(["good", "okay", "bad"]);

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to rate projects." },
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

  let rating: unknown;
  let note: unknown;
  try {
    const body = (await request.json()) as {
      rating?: unknown;
      note?: unknown;
    };
    rating = body.rating;
    note = body.note;
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be JSON." },
      { status: 400 }
    );
  }

  if (typeof rating !== "string" || !RATINGS.has(rating)) {
    return NextResponse.json(
      {
        error: "invalid_rating",
        message: 'rating must be "good", "okay" or "bad".',
      },
      { status: 400 }
    );
  }
  if (note !== undefined && note !== null && typeof note !== "string") {
    return NextResponse.json(
      { error: "invalid_note", message: "note must be a string or null." },
      { status: 400 }
    );
  }

  const feedback = await db.feedback.create({
    data: {
      projectId: project.id,
      rating,
      note: typeof note === "string" && note.trim() ? note.trim().slice(0, 2000) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    feedback: {
      id: feedback.id,
      rating: feedback.rating,
      note: feedback.note,
      createdAt: feedback.createdAt.toISOString(),
    },
  });
}
