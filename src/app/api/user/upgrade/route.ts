import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PLAN_CREDITS } from "@/lib/credit-amounts";

/**
 * POST /api/user/upgrade {plan} — set the plan flag (pro/elite/max).
 * No billing in the clone: this flips the plan the way a purchase would,
 * INCLUDING delivering the plan's credits as an instant demo grant
 * (balances never decrease — an unlock is never a downgrade). The grant
 * is itemized as a CreditEvent so it shows on the account ledger.
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

  const allowance = PLAN_CREDITS[plan] ?? 0;
  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });
  const balance = current?.credits ?? user.credits;

  /* Demo grant: raise the balance to the plan's allowance; if the user
     already holds more, keep theirs (an unlock never takes credits). */
  const granted = Math.max(0, allowance - balance);
  const updated = await db.user.update({
    where: { id: user.id },
    data: { plan, credits: Math.max(balance, allowance) },
  });
  if (granted > 0) {
    await db.creditEvent.create({
      data: {
        userId: user.id,
        projectId: null,
        stage: "UPGRADE",
        amount: granted,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    plan: updated.plan,
    credits: updated.credits,
    granted,
  });
}
