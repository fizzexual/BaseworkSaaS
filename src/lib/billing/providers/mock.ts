import { scopedLogger } from "@/lib/observability/logger";
import type { BillingProvider } from "./types";

const log = scopedLogger("billing:mock");

/**
 * Mock billing provider for zero-config dev. In mock mode the server action
 * (`startCheckout`) applies plan changes directly, so these checkout/portal
 * methods are thin stand-ins kept only for interface parity with Stripe.
 */
export const mockProvider: BillingProvider = {
  mode: "mock",

  async ensureCustomer({ organizationId }) {
    return `mock_cus_${organizationId}`;
  },

  async createCheckoutSession({ successUrl }) {
    return { url: successUrl };
  },

  async createPortalSession({ returnUrl }) {
    return { url: returnUrl };
  },

  async reportUsage({ quantity }) {
    log.debug({ quantity }, "mock reportUsage (no-op)");
  },
};
