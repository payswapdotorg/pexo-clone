import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * DB-backed session (PC2): same cookie name + HMAC mechanism as PC1, but the
 * payload now carries a userId that resolves to a real User row. getSession()
 * returns the full DB user (or null when the cookie is missing, tampered, or
 * the user was deleted) — everything server-side reads this.
 */
export const SESSION_COOKIE = "vidra_session";

const DEMO_SECRET =
  process.env.VIDRA_DEMO_SECRET ?? "vidra-pc1-demo-secret-0x5f3a";

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  issuedAt: number;
}

function sign(payload: string): string {
  return createHmac("sha256", DEMO_SECRET).update(payload).digest("base64url");
}

export function createSessionValue(
  user: Omit<SessionPayload, "issuedAt">
): string {
  const payload = JSON.stringify({ ...user, issuedAt: Date.now() });
  const body = Buffer.from(payload, "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function parseSessionValue(
  value: string | undefined
): SessionPayload | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Read the current session user from the request cookies (server-side). */
export async function getSession(): Promise<User | null> {
  const jar = await cookies();
  const payload = parseSessionValue(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.userId } });
  return user ?? null;
}

export const DEMO_USER = Object.freeze({
  name: "Ada Demo",
  email: "ada@demo.vidra.local",
});
