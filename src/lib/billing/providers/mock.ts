import { env } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";
import type { BillingProvider } from "./types";

const log = scopedLogger("billing:mock");

/**
 * Mock billing provider used in zero-config dev. Checkout redirects through an
 * internal route that actually applies the plan, so upgrade/downgrade flows are
 * fully exercised end-to-end without a Stripe account.
 */
export const mockProvider: BillingProvider = {
  mode: "mock",

  async ensureCustomer({ organizationId }) {
    return `mock_cus_${organizationId}`;
  },

  async createCheckoutSession({ organizationId, plan, successUrl, cancelUrl }) {
    const url = new URL("/api/billing/mock-checkout", env.APP_URL);
    url.searchParams.set("org", organizationId);
    url.searchParams.set("plan", plan);
    url.searchParams.set("redirect", successUrl);
    url.searchParams.set("cancel", cancelUrl);
    return { url: url.toString() };
  },

  async createPortalSession({ returnUrl }) {
    const url = new URL(returnUrl);
    url.searchParams.set("portal", "mock");
    return { url: url.toString() };
  },

  async reportUsage({ quantity }) {
    log.debug({ quantity }, "mock reportUsage (no-op)");
  },
};
