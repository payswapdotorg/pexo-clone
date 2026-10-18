import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionValue } from "@/lib/session";
import {
  clientIp,
  consumeRateLimit,
  generateDemoIdentity,
  pruneRateLimits,
  rateLimitedResponse,
  DEMO_EMAIL_PATTERN,
} from "@/lib/rate-limit";

/**
 * Demo login (hardening pass): issues a per-visitor sandbox account. The
 * Google flow remains a mock, but it no longer lands everyone on one
 * shared account — visitors must not see each other's projects or drain a
 * common credit pool. Each anonymous login gets a unique generated identity
 * (own 100 credits); returning visitors are routed back to their own
 * sandbox via the hint cookie. Scripted signup farming is capped by a
 * per-network rate limit: every account is a fresh budget backed by real
 * provider keys, so this is the spend guard for the public deployment.
 */

/** Cookie that routes a returning visitor back to their own sandbox. */
const DEMO_HINT_COOKIE = "vidra_demo_hint";
const DEMO_HINT_MAX_AGE = 60 * 60 * 24 * 7;

function readDemoHint(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== DEMO_HINT_COOKIE) continue;
    const value = decodeURIComponent(part.slice(separator + 1).trim());
    return DEMO_EMAIL_PATTERN.test(value) ? value : null;
  }
  return null;
}

/** Delete generated sandboxes older than a week that were never used. */
async function pruneUnusedSandboxes(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stale = await db.user.findMany({
    where: {
      email: { startsWith: "demo-", endsWith: "@demo.vidra.local" },
      createdAt: { lt: cutoff },
    },
    select: { id: true, email: true, _count: { select: { projects: true } } },
  });
  const unused = stale
    .filter((user) => DEMO_EMAIL_PATTERN.test(user.email))
    .filter((user) => user._count.projects === 0)
    .map((user) => user.id);
  if (unused.length > 0) {
    await db.user.deleteMany({ where: { id: { in: unused } } });
  }
  await pruneRateLimits();
}

export async function POST(request: Request) {
  // Spend guard: a public deployment cannot allow unlimited sign-ins per
  // network — each new account starts with a fresh 100-credit budget.
  const decision = await consumeRateLimit("login:ip", clientIp(request), {
    env: "LOGIN_RATE_LIMIT",
    limit: 10,
  });
  if (!decision.ok) {
    return rateLimitedResponse(
      decision,
      "Too many sign-ins from this network — please wait a few minutes and try again."
    );
  }

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

  if (!email) {
    // Anonymous login: reuse the visitor's own sandbox when the hint
    // cookie is present, otherwise generate a fresh per-visitor identity.
    const hint = readDemoHint(request);
    if (hint) {
      email = hint;
      name = name ?? "Demo Guest";
    } else {
      const identity = generateDemoIdentity();
      email = identity.email;
      name = name ?? identity.name;
    }
  }

  // email is always set here: explicit, the visitor's hint cookie, or a
  // freshly generated per-visitor identity — never a shared account.
  const targetEmail = email;
  const targetName = name ?? (targetEmail.split("@")[0] || "Guest");

  const user = await db.user.upsert({
    where: { email: targetEmail },
    update: name ? { name: targetName } : {},
    create: { name: targetName, email: targetEmail },
  });

  // Opportunistic housekeeping (cheap, low probability).
  if (Math.random() < 0.05) {
    await pruneUnusedSandboxes().catch(() => {});
  }

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
  if (DEMO_EMAIL_PATTERN.test(user.email)) {
    response.cookies.set(DEMO_HINT_COOKIE, user.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: DEMO_HINT_MAX_AGE,
    });
  }
  return response;
}
