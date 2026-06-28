import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  creditBalances,
  organizations,
  type PlanId,
  type Subscription,
  subscriptions,
} from "@/lib/db/schema";
import { PLANS } from "./plans";

export async function getSubscription(organizationId: string): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

export interface SetPlanInput {
  organizationId: string;
  plan: PlanId;
  status?: Subscription["status"];
  seats?: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  /** Reset the credit balance to the plan's included amount (new period / upgrade). */
  resetCredits?: boolean;
}

/**
 * Upsert an org's subscription, mirror the plan onto the organization row, and
 * keep the credit balance's included amount in sync. Used by both the Stripe
 * webhook and the mock checkout flow, so DB state is identical in either mode.
 */
export async function setPlan(input: SetPlanInput): Promise<void> {
  const plan = PLANS[input.plan];
  const now = new Date();
  const resetCredits = input.resetCredits ?? false;

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, input.organizationId))
      .limit(1);

    const values = {
      plan: input.plan,
      status: input.status ?? "active",
      seats: input.seats ?? existing?.seats ?? 1,
      stripeCustomerId: input.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
      stripePriceId: input.stripePriceId ?? existing?.stripePriceId ?? null,
      currentPeriodStart: input.currentPeriodStart ?? existing?.currentPeriodStart ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? existing?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? existing?.cancelAtPeriodEnd ?? false,
      updatedAt: now,
    };

    if (existing) {
      await tx.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
    } else {
      await tx
        .insert(subscriptions)
        .values({ id: nanoid(), organizationId: input.organizationId, createdAt: now, ...values });
    }

    await tx
      .update(organizations)
      .set({ plan: input.plan, stripeCustomerId: values.stripeCustomerId })
      .where(eq(organizations.id, input.organizationId));

    const [bal] = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.organizationId, input.organizationId))
      .limit(1);

    if (!bal) {
      await tx.insert(creditBalances).values({
        organizationId: input.organizationId,
        balance: plan.includedCredits,
        includedMonthly: plan.includedCredits,
        overage: 0,
        periodStart: input.currentPeriodStart ?? now,
        periodEnd: input.currentPeriodEnd ?? null,
      });
    } else {
      await tx
        .update(creditBalances)
        .set({
          includedMonthly: plan.includedCredits,
          ...(resetCredits
            ? {
                balance: plan.includedCredits,
                overage: 0,
                periodStart: input.currentPeriodStart ?? now,
                periodEnd: input.currentPeriodEnd ?? null,
              }
            : {}),
          updatedAt: now,
        })
        .where(eq(creditBalances.organizationId, input.organizationId));
    }
  });
}

export interface BillingSummary {
  plan: PlanId;
  status: Subscription["status"];
  seats: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  balance: number;
  includedMonthly: number;
  overage: number;
}

export async function getBillingSummary(organizationId: string): Promise<BillingSummary> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  const [bal] = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.organizationId, organizationId))
    .limit(1);

  return {
    plan: sub?.plan ?? "free",
    status: sub?.status ?? "active",
    seats: sub?.seats ?? 1,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    balance: bal?.balance ?? 0,
    includedMonthly: bal?.includedMonthly ?? PLANS.free.includedCredits,
    overage: bal?.overage ?? 0,
  };
}
