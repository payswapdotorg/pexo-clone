import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * GET /api/biz/web-push/events?after_event_id=N&project_id=ID — long-poll
 * event stream (PRODUCT-SPEC §4): polls the ProjectEvent table every second
 * for up to 25s, scoped to the session user's projects, and returns as
 * soon as anything newer than the cursor exists.
 */
export const dynamic = "force-dynamic";

const POLL_MS = 1_000;
const TIMEOUT_MS = 25_000;

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to receive events." },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const after = url.searchParams.get("after_event_id");
  const projectId = url.searchParams.get("project_id");

  if (after !== null && !/^[0-9]+$/.test(after)) {
    return NextResponse.json(
      { error: "invalid_cursor", message: "after_event_id must be numeric." },
      { status: 400 }
    );
  }
  const cursor = after ? parseInt(after, 10) : 0;

  let projectFilter: { in: string[] } | string;
  if (projectId) {
    const owned = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "project_not_found", message: "That project does not exist." },
        { status: 404 }
      );
    }
    projectFilter = projectId;
  } else {
    const owned = await db.project.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    projectFilter = { in: owned.map((project) => project.id) };
  }

  const deadline = Date.now() + TIMEOUT_MS;
  for (;;) {
    const events = await db.projectEvent.findMany({
      where: { id: { gt: cursor }, projectId: projectFilter },
      orderBy: { id: "asc" },
      take: 200,
    });

    if (events.length > 0) {
      return NextResponse.json({
        events: events.map((event) => ({
          id: event.id,
          projectId: event.projectId,
          type: event.type,
          payload: event.payload,
          createdAt: event.createdAt.toISOString(),
        })),
        last_event_id: events[events.length - 1].id,
      });
    }

    if (Date.now() >= deadline) {
      return NextResponse.json({ events: [], last_event_id: cursor });
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
