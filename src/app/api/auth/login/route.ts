import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  DEMO_USER,
  createSessionValue,
} from "@/lib/session";

/**
 * Demo login (PC1): both buttons land here. The Google flow is a mock that
 * issues the same demo session (PRODUCT-SPEC §2 /login row). PC2 swaps the
 * mock for a real OAuth round-trip.
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

  const user = {
    name: name ?? DEMO_USER.name,
    email: email ?? DEMO_USER.email,
  };

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, createSessionValue(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
