import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** Current session, or null (PRODUCT-SPEC §4 session surface). */
export async function GET() {
  const user = await getSession();
  return NextResponse.json({ user });
}
