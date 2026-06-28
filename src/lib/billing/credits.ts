import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { type CreditBalance, creditBalances, usageEvents } from "@/lib/db/schema";

/**
 * Credit math + ledger. Credits are the unit AI usage is metered in; a plan
 * includes a monthly allotment and (on paid plans) overage is billed per
 * credit. Every charge/grant is written to `usage_events`, which doubles as an
 * append-only ledger.
 */

/** Convert token usage to credits. ~400 tokens = 1 credit (min 1 per call). */
export function creditsForTokens(inputTokens: number, outputTokens: number): number {
  return Math.max(1, Math.ceil((inputTokens + outputTokens) / 400));
}

export async function getBalance(organizationId: string): Promise<CreditBalance | null> {
  const [row] = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

export interface ChargeInput {
  organizationId: string;
  userId?: string | null;
  credits: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  threadId?: string | null;
  /** Paid plans allow consumption beyond the included balance (billed as overage). */
  allowOverage: boolean;
}

export interface ChargeResult {
  ok: boolean;
  reason?: "insufficient";
  charged: number;
  overage: number;
  balanceAfter: number;
}

/** Atomically deduct credits and append a usage event. */
export async function chargeCredits(input: ChargeInput): Promise<ChargeResult> {
  return db.transaction(async (tx) => {
    const [bal] = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.organizationId, input.organizationId))
      .limit(1);

    const current = bal?.balance ?? 0;
    let newBalance = current - input.credits;
    let overageUnits = 0;

    if (newBalance < 0) {
      if (!input.allowOverage) {
        return { ok: false, reason: "insufficient", charged: 0, overage: 0, balanceAfter: current };
      }
      overageUnits = -newBalance;
      newBalance = 0;
    }

    if (bal) {
      await tx
        .update(creditBalances)
        .set({ balance: newBalance, overage: bal.overage + overageUnits, updatedAt: new Date() })
        .where(eq(creditBalances.organizationId, input.organizationId));
    } else {
      await tx.insert(creditBalances).values({
        organizationId: input.organizationId,
        balance: newBalance,
        includedMonthly: 0,
        overage: overageUnits,
        periodStart: new Date(),
      });
    }

    await tx.insert(usageEvents).values({
      id: nanoid(),
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      type: "ai.chat",
      model: input.model,
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      credits: -input.credits,
      balanceAfter: newBalance,
      threadId: input.threadId ?? null,
    });

    return { ok: true, charged: input.credits, overage: overageUnits, balanceAfter: newBalance };
  });
}

/** Add credits (admin grant, refund, or plan top-up). Returns the new balance. */
export async function grantCredits(input: {
  organizationId: string;
  credits: number;
  type?: "grant" | "adjustment";
  userId?: string | null;
}): Promise<number> {
  return db.transaction(async (tx) => {
    const [bal] = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.organizationId, input.organizationId))
      .limit(1);
    const newBalance = (bal?.balance ?? 0) + input.credits;

    if (bal) {
      await tx
        .update(creditBalances)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(creditBalances.organizationId, input.organizationId));
    } else {
      await tx.insert(creditBalances).values({
        organizationId: input.organizationId,
        balance: newBalance,
        includedMonthly: 0,
        overage: 0,
        periodStart: new Date(),
      });
    }

    await tx.insert(usageEvents).values({
      id: nanoid(),
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      type: input.type ?? "grant",
      credits: input.credits,
      balanceAfter: newBalance,
    });

    return newBalance;
  });
}
