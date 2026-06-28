import type Stripe from "stripe";
import type { PlanId, Subscription } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";
import { getStripe } from "./providers/stripe";
import { setPlan } from "./subscriptions";

const log = scopedLogger("billing:webhook");

function mapStatus(status: Stripe.Subscription.Status): Subscription["status"] {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "paused":
      return "paused";
    default:
      return "active";
  }
}

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const orgId = sub.metadata?.organizationId;
  if (!orgId) return;
  const plan = (sub.metadata?.plan as PlanId) ?? "pro";
  const item = sub.items.data[0];
  // In recent Stripe API versions the period lives on the subscription item.
  const period = item as unknown as { current_period_start?: number; current_period_end?: number };

  await setPlan({
    organizationId: orgId,
    plan,
    status: mapStatus(sub.status),
    stripeCustomerId: idOf(sub.customer),
    stripeSubscriptionId: sub.id,
    stripePriceId: item?.price.id ?? null,
    currentPeriodStart: period?.current_period_start
      ? new Date(period.current_period_start * 1000)
      : null,
    currentPeriodEnd: period?.current_period_end
      ? new Date(period.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    resetCredits: false,
  });
}

/**
 * Verify and process a Stripe webhook. This is the "everyone fakes it" part —
 * the single place subscription state is reconciled into our database.
 */
export async function handleStripeWebhook(rawBody: string, signature: string) {
  const event = getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET ?? "",
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const orgId = s.metadata?.organizationId;
      const plan = s.metadata?.plan as PlanId | undefined;
      if (orgId && plan) {
        await setPlan({
          organizationId: orgId,
          plan,
          status: "active",
          stripeCustomerId: idOf(s.customer),
          stripeSubscriptionId: idOf(s.subscription),
          resetCredits: true,
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (orgId) await setPlan({ organizationId: orgId, plan: "free", status: "canceled" });
      break;
    }
    default:
      log.debug({ type: event.type }, "unhandled stripe event");
  }

  return { received: true, type: event.type };
}
