import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";
import { stripePriceIdFor } from "../plans";
import type { BillingProvider } from "./types";

const log = scopedLogger("billing:stripe");

let client: Stripe | null = null;

/** Lazily construct the Stripe client so mock mode never needs a key. */
export function getStripe(): Stripe {
  if (!client) {
    if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return client;
}

export const stripeProvider: BillingProvider = {
  mode: "stripe",

  async ensureCustomer({ organizationId, email, name, existingCustomerId }) {
    if (existingCustomerId) return existingCustomerId;
    const customer = await getStripe().customers.create({
      email,
      name,
      metadata: { organizationId },
    });
    await db
      .update(organizations)
      .set({ stripeCustomerId: customer.id })
      .where(eq(organizations.id, organizationId));
    return customer.id;
  },

  async createCheckoutSession({
    organizationId,
    plan,
    seats,
    customerId,
    customerEmail,
    successUrl,
    cancelUrl,
  }) {
    const price = stripePriceIdFor(plan);
    if (!price) {
      throw new Error(`No Stripe price configured for plan "${plan}". Run \`pnpm stripe:sync\`.`);
    }
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [{ price, quantity: seats }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: { metadata: { organizationId, plan } },
      metadata: { organizationId, plan },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
  },

  async createPortalSession({ customerId, returnUrl }) {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },

  async reportUsage({ customerId, quantity }) {
    if (!customerId || quantity <= 0) return;
    try {
      // Modern usage-based billing via the Meter Events API. The "ai_credits"
      // meter is created by `pnpm stripe:sync`.
      await getStripe().billing.meterEvents.create({
        event_name: "ai_credits",
        payload: { stripe_customer_id: customerId, value: String(quantity) },
      });
    } catch (err) {
      log.error({ err }, "failed to report usage to Stripe");
    }
  },
};
