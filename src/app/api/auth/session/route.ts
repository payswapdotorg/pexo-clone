import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** Current session user, or null (PRODUCT-SPEC §4 session surface). */
export async function GET() {
  const user = await getSession();
  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          plan: user.plan,
        }
      : null,
  });
}
