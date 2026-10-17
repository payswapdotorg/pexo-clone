import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** GET /api/user/credits — header meter polling. */
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to view credits." },
      { status: 401 }
    );
  }
  return NextResponse.json({ credits: user.credits, plan: user.plan });
}
