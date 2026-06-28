import type { PlanId } from "@/lib/db/schema";

export interface EnsureCustomerParams {
  organizationId: string;
  email: string;
  name: string;
  existingCustomerId?: string | null;
}

export interface CheckoutParams {
  organizationId: string;
  plan: PlanId;
  seats: number;
  customerId?: string | null;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalParams {
  customerId: string;
  returnUrl: string;
}

export interface ReportUsageParams {
  customerId?: string | null;
  subscriptionId?: string | null;
  quantity: number;
}

/**
 * The billing surface the app depends on. Two implementations — `mock` (used
 * zero-config, simulates checkout end-to-end) and `stripe` — are
 * interchangeable, so the rest of the app never imports Stripe directly.
 */
export interface BillingProvider {
  readonly mode: "stripe" | "mock";
  ensureCustomer(params: EnsureCustomerParams): Promise<string>;
  createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>;
  createPortalSession(params: PortalParams): Promise<{ url: string }>;
  reportUsage(params: ReportUsageParams): Promise<void>;
}
