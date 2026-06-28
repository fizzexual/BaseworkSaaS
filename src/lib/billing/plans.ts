import type { PlanId } from "@/lib/db/schema";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  /** Monthly price in USD cents. */
  priceMonthly: number;
  /** usage credits included each billing period. */
  includedCredits: number;
  /** Seats included; null = unlimited. */
  seats: number | null;
  /** Cents charged per credit consumed beyond the included amount. */
  overagePerCredit: number;
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "For trying things out and small side projects.",
    priceMonthly: 0,
    includedCredits: 200,
    seats: 2,
    overagePerCredit: 0,
    features: [
      "Up to 2 team members",
      "200 usage credits / month",
      "Community support",
      "1 project",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For growing teams shipping real products.",
    priceMonthly: 2900,
    includedCredits: 5000,
    seats: 10,
    overagePerCredit: 1,
    popular: true,
    features: [
      "Up to 10 team members",
      "5,000 usage credits / month",
      "Usage-based overage billing",
      "Priority email support",
      "Audit log",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    description: "For companies that need room to grow.",
    priceMonthly: 9900,
    includedCredits: 50000,
    seats: null,
    overagePerCredit: 1,
    features: [
      "Unlimited team members",
      "50,000 usage credits / month",
      "Usage-based overage billing",
      "SSO & SAML (bring your own)",
      "SLA & dedicated support",
    ],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.pro, PLANS.scale];

export function planById(id: PlanId): Plan {
  return PLANS[id];
}

/** Resolve the configured Stripe Price id for a plan (set by `stripe:sync`). */
export function stripePriceIdFor(id: PlanId): string | undefined {
  const map: Record<PlanId, string | undefined> = {
    free: undefined,
    pro: process.env.STRIPE_PRICE_PRO,
    scale: process.env.STRIPE_PRICE_SCALE,
  };
  return map[id];
}
