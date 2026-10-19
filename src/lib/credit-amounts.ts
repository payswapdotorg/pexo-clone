/**
 * Credit contract (AGENT-PROTOCOL) — shared, client-safe constants.
 *
 * Server code (spend/rollback) lives in src/lib/agent/credits.ts; UI copy
 * (pricing FAQ, plan cards, the account ledger) imports from HERE so the
 * numbers a visitor reads can never drift from the numbers the engine
 * charges. Single source of truth, no db imports (client-bundle safe).
 */
export const CREDITS = Object.freeze({
  PROJECT_START: 5,
  PREVIEW: 11,
  RENDER: 6,
});

export type CreditStage = keyof typeof CREDITS;

/** Demo-mode plan allowances (matches PLANS in content.ts, "credits / mo"). */
export const PLAN_CREDITS: Readonly<Record<string, number>> = Object.freeze({
  free: 100,
  pro: 3500,
  elite: 9000,
  max: 18000,
});

/** Human labels for ledger rows (spend stages + the demo grant). */
export const STAGE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  PROJECT_START: "Project start",
  PREVIEW: "Still preview",
  RENDER: "Render",
  UPGRADE: "Plan unlock (demo grant)",
});

/** Format an amount for ledger display: signed, e.g. "-11" / "+3,500". */
export function formatCreditAmount(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${Math.abs(amount).toLocaleString("en-US")}`;
}
