import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Mock demo session (PC1 scope per the work order): a signed cookie created
 * by either login button. PC2 replaces this with the real session layer —
 * same cookie name, stronger identity.
 */
export const SESSION_COOKIE = "vidra_session";

const DEMO_SECRET =
  process.env.VIDRA_DEMO_SECRET ?? "vidra-pc1-demo-secret-0x5f3a";

export interface DemoUser {
  name: string;
  email: string;
  issuedAt: number;
}

function sign(payload: string): string {
  return createHmac("sha256", DEMO_SECRET).update(payload).digest("base64url");
}

export function createSessionValue(user: Omit<DemoUser, "issuedAt">): string {
  const payload = JSON.stringify({ ...user, issuedAt: Date.now() });
  const body = Buffer.from(payload, "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function parseSessionValue(value: string | undefined): DemoUser | null {
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
    ) as DemoUser;
    if (typeof parsed.name !== "string" || typeof parsed.email !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Read the current demo session from the request cookies (server-side). */
export async function getSession(): Promise<DemoUser | null> {
  const jar = await cookies();
  return parseSessionValue(jar.get(SESSION_COOKIE)?.value);
}

export const DEMO_USER: Omit<DemoUser, "issuedAt"> = {
  name: "Ada Demo",
  email: "ada@demo.vidra.local",
};
