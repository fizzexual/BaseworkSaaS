"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { billing } from "@/lib/billing";
import { planById } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { requireActiveOrg } from "@/server/context";

export async function startCheckout(plan: PlanId) {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "billing:manage");
  planById(plan); // validate

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

  await audit({
    organizationId: ctx.activeOrg.id,
    actorId: ctx.user.id,
    action: "billing.checkout.start",
    targetType: "plan",
    targetId: plan,
  });

  redirect(url);
}

export async function openBillingPortal() {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "billing:manage");

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
