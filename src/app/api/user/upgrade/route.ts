import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * POST /api/user/upgrade {plan} — set the plan flag (pro/elite/max).
 * No billing in the clone: this flips the plan the way a purchase would.
 */
const PLANS = new Set(["pro", "elite", "max"]);

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to change plans." },
      { status: 401 }
    );
  }

  let plan: unknown;
  try {
    const body = (await request.json()) as { plan?: unknown };
    plan = body.plan;
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be JSON." },
      { status: 400 }
    );
  }
  if (typeof plan !== "string" || !PLANS.has(plan)) {
    return NextResponse.json(
      {
        error: "invalid_plan",
        message: 'plan must be "pro", "elite" or "max".',
      },
      { status: 400 }
    );
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { plan },
  });

  return NextResponse.json({
    ok: true,
    plan: updated.plan,
    credits: updated.credits,
  });
}
