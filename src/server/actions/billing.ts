"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { billing, planById, setPlan } from "@/lib/billing";
import type { PlanId } from "@/lib/db/schema";
import { billingMode, env } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { requireActiveOrg } from "@/server/context";

export async function startCheckout(plan: PlanId) {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "billing:manage");
  planById(plan); // validate plan id

  await audit({
    organizationId: ctx.activeOrg.id,
    actorId: ctx.user.id,
    action: "billing.checkout.start",
    targetType: "plan",
    targetId: plan,
  });

  // Mock mode: simulate a completed Stripe checkout by applying the plan now,
  // then soft-redirect back to billing. A relative path triggers a clean RSC
  // navigation (redirecting a Server Action to an absolute internal URL is
  // unreliable — the follow-up can arrive as a POST).
  if (billingMode === "mock") {
    const now = new Date();
    await setPlan({
      organizationId: ctx.activeOrg.id,
      plan,
      status: "active",
      resetCredits: true,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
    redirect("/dashboard/billing?upgraded=1");
  }

  // Real Stripe checkout → redirect to the external hosted checkout page.
  const customerId = await billing.ensureCustomer({
    organizationId: ctx.activeOrg.id,
    email: ctx.user.email,
    name: ctx.activeOrg.name,
    existingCustomerId: ctx.activeOrg.stripeCustomerId,
  });
  const { url } = await billing.createCheckoutSession({
    organizationId: ctx.activeOrg.id,
    plan,
    seats: 1,
    customerId,
    customerEmail: ctx.user.email,
    successUrl: `${env.APP_URL}/dashboard/billing?upgraded=1`,
    cancelUrl: `${env.APP_URL}/dashboard/billing?canceled=1`,
  });
  redirect(url);
}

export async function openBillingPortal() {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "billing:manage");

  // Mock mode has no real portal — just return to billing.
  if (billingMode === "mock") {
    redirect("/dashboard/billing?portal=mock");
  }

  const customerId = await billing.ensureCustomer({
    organizationId: ctx.activeOrg.id,
    email: ctx.user.email,
    name: ctx.activeOrg.name,
    existingCustomerId: ctx.activeOrg.stripeCustomerId,
  });
  const { url } = await billing.createPortalSession({
    customerId,
    returnUrl: `${env.APP_URL}/dashboard/billing`,
  });
  redirect(url);
}
