import { billingMode } from "@/lib/env";
import { mockProvider } from "./providers/mock";
import { stripeProvider } from "./providers/stripe";
import type { BillingProvider } from "./providers/types";

/** The active billing provider, selected by environment (Stripe vs. mock). */
export const billing: BillingProvider = billingMode === "stripe" ? stripeProvider : mockProvider;

export * from "./credits";
export { PLAN_LIST, PLANS, type Plan, planById, stripePriceIdFor } from "./plans";
export type { BillingProvider } from "./providers/types";
export * from "./subscriptions";
