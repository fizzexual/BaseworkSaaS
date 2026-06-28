import { billing } from "@/lib/billing";
import { chargeCredits, creditsForTokens, getBalance } from "@/lib/billing/credits";
import { PLANS } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/db/schema";
import { scopedLogger } from "@/lib/observability/logger";

const log = scopedLogger("ai:metering");

export class OutOfCreditsError extends Error {
  constructor() {
    super("OUT_OF_CREDITS");
    this.name = "OutOfCreditsError";
  }
}

/** Throw if the org cannot make an AI call (out of credits, no overage allowed). */
export async function precheck(params: {
  organizationId: string;
  plan: PlanId;
  byo: boolean;
}): Promise<void> {
  if (params.byo) return; // BYO key → not metered
  const plan = PLANS[params.plan];
  if (plan.overagePerCredit > 0) return; // paid plans may exceed included credits
  const balance = await getBalance(params.organizationId);
  if (!balance || balance.balance <= 0) throw new OutOfCreditsError();
}

/** Charge credits for a completed generation and report overage to Stripe. */
export async function recordUsage(params: {
  organizationId: string;
  userId: string;
  plan: PlanId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  threadId?: string | null;
  byo: boolean;
  customerId?: string | null;
}): Promise<{ credits: number; overage: number }> {
  if (params.byo) return { credits: 0, overage: 0 };

  const plan = PLANS[params.plan];
  const credits = creditsForTokens(params.inputTokens, params.outputTokens);
  const result = await chargeCredits({
    organizationId: params.organizationId,
    userId: params.userId,
    credits,
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    threadId: params.threadId,
    allowOverage: plan.overagePerCredit > 0,
  });

  if (result.overage > 0 && params.customerId) {
    await billing.reportUsage({ customerId: params.customerId, quantity: result.overage });
  }

  log.debug(
    { organizationId: params.organizationId, credits: result.charged, overage: result.overage },
    "recorded ai usage",
  );
  return { credits: result.charged, overage: result.overage };
}
