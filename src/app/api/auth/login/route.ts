import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  DEMO_USER,
  createSessionValue,
} from "@/lib/session";

/**
 * Demo login (PC2): upserts the User row by email (new accounts start with
 * 100 credits on the free plan), then issues the signed session cookie.
 * The Google flow remains a mock that lands on the same demo session.
 */
export async function POST(request: Request) {
  let name: string | undefined;
  let email: string | undefined;
  try {
    const body = (await request.json()) as { name?: unknown; email?: unknown };
    if (typeof body.name === "string" && body.name.trim()) {
      name = body.name.trim().slice(0, 40);
    }
    if (
      typeof body.email === "string" &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)
    ) {
      email = body.email.trim().slice(0, 80);
    }
  } catch {
    /* body optional — anonymous demo login is fine */
  }

  const targetEmail = email ?? DEMO_USER.email;
  const targetName = name ?? DEMO_USER.name;

  const user = await db.user.upsert({
    where: { email: targetEmail },
    update: name ? { name: targetName } : {},
    create: { name: targetName, email: targetEmail },
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      plan: user.plan,
    },
  });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionValue({
      userId: user.id,
      name: user.name,
      email: user.email,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );
  return response;
}
