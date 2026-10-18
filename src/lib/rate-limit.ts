import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DB-backed fixed-window rate limiter (public-deployment hardening pass).
 *
 * The clone runs on serverless (Vercel) where instances don't share memory,
 * so the Postgres row IS the counter. The consume step is a single atomic
 * INSERT … ON CONFLICT upsert (Postgres row-locks the counter on conflict),
 * so concurrent requests can't race past the limit — the request that
 * takes the count over the line is the one that gets blocked.
 *
 * Windows are fixed, not sliding: a burst just after a window boundary gets
 * a full fresh budget. That is the standard trade-off for a demo and it
 * never false-blocks. Stale rows are pruned opportunistically (see
 * pruneRateLimits) so the table stays tiny.
 */

/** All limits share one 10-minute window. */
export const RATE_WINDOW_MS = 10 * 60 * 1000;

/** A "demo identity" is a real per-visitor sandbox account (honest mock). */
export const DEMO_EMAIL_PATTERN = /^demo-[a-z0-9]+@demo\.vidra\.local$/;

export interface RateLimitOptions {
  /** Environment variable that can override the default (ops escape hatch). */
  env: string;
  /** Requests allowed per window by default. */
  limit: number;
}

export interface RateLimitDecision {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

function envLimit(opts: RateLimitOptions): number {
  const raw = process.env[opts.env];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : opts.limit;
}

/**
 * Consume one unit of the fixed window for `key`. Returns whether the
 * request fits, plus how many slots remain and how long until the window
 * resets (for the Retry-After header).
 */
export async function consumeRateLimit(
  scope: string,
  identity: string,
  opts: RateLimitOptions
): Promise<RateLimitDecision> {
  const limit = envLimit(opts);
  const key = `${scope}:${identity}`;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - RATE_WINDOW_MS);

  // Atomic: insert-rotate-or-increment in one statement. `excluded` is the
  // proposed row; the bare table name refers to the existing row.
  const rows = await db.$queryRaw<
    Array<{ count: bigint; windowStart: Date }>
  >`
    INSERT INTO "RateLimit" ("key", "count", "windowStart", "updatedAt")
    VALUES (${key}, 1, ${now.toISOString()}::timestamp, ${now.toISOString()}::timestamp)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= ${staleBefore.toISOString()}::timestamp THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= ${staleBefore.toISOString()}::timestamp THEN ${now.toISOString()}::timestamp
        ELSE "RateLimit"."windowStart"
      END,
      "updatedAt" = ${now.toISOString()}::timestamp
    RETURNING "count", "windowStart"
  `;

  const count = Number(rows[0]?.count ?? 1);
  if (count <= limit) {
    return { ok: true, remaining: limit - count, retryAfterSec: 0 };
  }
  const startMs = rows[0]?.windowStart
    ? new Date(rows[0].windowStart).getTime()
    : now.getTime();
  const retryAfterSec = Math.max(
    1,
    Math.ceil((startMs + RATE_WINDOW_MS - now.getTime()) / 1000)
  );
  return { ok: false, remaining: 0, retryAfterSec };
}

/** Best-effort friendly 429 response with the standard Retry-After header. */
export function rateLimitedResponse(
  decision: RateLimitDecision,
  message: string
): NextResponse {
  return NextResponse.json(
    { error: "rate_limited", message },
    {
      status: 429,
      headers: { "Retry-After": String(decision.retryAfterSec) },
    }
  );
}

/**
 * Opportunistic housekeeping (called with low probability from the login
 * route): drop counter rows whose window has long expired.
 */
export async function pruneRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.$executeRaw`
    DELETE FROM "RateLimit" WHERE "windowStart" < ${cutoff.toISOString()}::timestamp
  `;
}

/** Generate a fresh per-visitor demo identity (never collides in practice). */
export function generateDemoIdentity(): { name: string; email: string } {
  const token = randomBytes(8).toString("hex");
  return { name: "Demo Guest", email: `demo-${token}@demo.vidra.local` };
}

/**
 * The client IP for per-network throttling. Vercel appends the real
 * connecting IP to x-forwarded-for as the LAST hop (client-supplied hops
 * come first and are attacker-controllable), so the last hop is the only
 * trustworthy one; unknown when absent. This caps single-source scripted
 * signups — it is a spend guard, not DDoS protection.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
