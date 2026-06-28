import { type NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/providers/stripe";
import { setPlan } from "@/lib/billing/subscriptions";
import type { PlanId } from "@/lib/db/schema";
import { billingMode } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";

const log = scopedLogger("billing:checkout-return");

/**
 * Stripe redirects here (GET) after a completed Checkout. We retrieve the
 * session and apply the plan immediately — so local dev works without the
 * Stripe CLI. The webhook does the same on its own (idempotent); whichever
 * fires first wins.
 */
export async function GET(req: NextRequest) {
  const billingUrl = new URL("/dashboard/billing", req.url);
  const sessionId = new URL(req.url).searchParams.get("session_id");

  if (billingMode !== "stripe" || !sessionId) {
    return NextResponse.redirect(billingUrl);
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const orgId = session.metadata?.organizationId;
    const plan = session.metadata?.plan as PlanId | undefined;
    const paid = session.status === "complete" || session.payment_status === "paid";

    if (orgId && plan && paid) {
      const now = new Date();
      await setPlan({
        organizationId: orgId,
        plan,
        status: "active",
        resetCredits: true,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
        stripeSubscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null),
      });
      billingUrl.searchParams.set("upgraded", "1");
    }
  } catch (err) {
    log.error({ err }, "failed to finalize checkout return");
  }

  return NextResponse.redirect(billingUrl);
}
