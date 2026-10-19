import { db } from "@/lib/db";
import { CREDITS, type CreditStage } from "@/lib/credit-amounts";

export { CREDITS };
export type { CreditStage };

/**
 * Credit contract (AGENT-PROTOCOL): per-stage costs and transactional
 * spend/rollback helpers. Spends are atomic (guarded updateMany) so a
 * concurrent request can never drive a balance negative. The constants
 * live in src/lib/credit-amounts.ts (client-safe single source of truth).
 */

export interface SpendResult {
  ok: boolean;
  balance: number;
  eventId?: string;
}

export async function spendCredits(
  userId: string,
  projectId: string | null,
  stage: CreditStage
): Promise<SpendResult> {
  const amount = CREDITS[stage];
  const debited = await db.user.updateMany({
    where: { id: userId, credits: { gte: amount } },
    data: { credits: { decrement: amount } },
  });
  if (debited.count === 0) {
    const user = await db.user.findUnique({ where: { id: userId } });
    return { ok: false, balance: user?.credits ?? 0 };
  }
  const event = await db.creditEvent.create({
    data: { userId, projectId, stage, amount: -amount },
  });
  const user = await db.user.findUnique({ where: { id: userId } });
  return { ok: true, balance: user?.credits ?? 0, eventId: event.id };
}

/** Undo a spend (generation failed after the debit): restore + drop event. */
export async function rollbackCredits(eventId: string): Promise<number | null> {
  const event = await db.creditEvent.findUnique({ where: { id: eventId } });
  if (!event) return null;
  await db.user.update({
    where: { id: event.userId },
    data: { credits: { increment: -event.amount } },
  });
  await db.creditEvent.delete({ where: { id: eventId } });
  const user = await db.user.findUnique({ where: { id: event.userId } });
  return user?.credits ?? null;
}
