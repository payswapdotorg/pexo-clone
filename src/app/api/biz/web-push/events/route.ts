import { NextResponse } from "next/server";

/**
 * GET /api/biz/web-push/events?after_event_id=… — long-poll event stream
 * (PRODUCT-SPEC §4). PC1: returns an empty event list immediately — no
 * events are produced until the real agent brain lands in PC2. The cursor
 * parameter is accepted and validated so the client contract already holds.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const after = url.searchParams.get("after_event_id");
  if (after !== null && !/^[0-9]+$/.test(after)) {
    return NextResponse.json(
      { error: "invalid_cursor", message: "after_event_id must be numeric." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    events: [],
    lastEventId: after ?? "0",
  });
}
