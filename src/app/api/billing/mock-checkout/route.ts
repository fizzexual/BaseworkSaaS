import { type NextRequest, NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { setPlan } from "@/lib/billing/subscriptions";
import type { PlanId } from "@/lib/db/schema";
import { billingMode } from "@/lib/env";
import { assertPermission } from "@/lib/rbac";
import { requireActiveOrg } from "@/server/context";

/**
 * Simulated Stripe Checkout for zero-config dev. Verifies the caller can manage
 * billing for the org, applies the plan (identical DB path to the real Stripe
 * webhook), then redirects back — so the upgrade flow is genuinely exercised.
 */
export async function GET(req: NextRequest) {
  if (billingMode !== "mock") return new NextResponse("Not found", { status: 404 });

  const url = new URL(req.url);
  const orgParam = url.searchParams.get("org");
  const plan = url.searchParams.get("plan") as PlanId | null;
  const redirectTo = url.searchParams.get("redirect") ?? "/dashboard/billing";
  const cancelTo = url.searchParams.get("cancel") ?? "/dashboard/billing";

  let ctx: Awaited<ReturnType<typeof requireActiveOrg>> | null = null;
  try {
    ctx = await requireActiveOrg();
  } catch {
    ctx = null;
  }

  if (!ctx || !plan || ctx.activeOrg.id !== orgParam) {
    return NextResponse.redirect(new URL(cancelTo, req.url));
  }

  assertPermission(ctx.role, "billing:manage");

  const now = new Date();
  await setPlan({
    organizationId: ctx.activeOrg.id,
    plan,
    status: "active",
    resetCredits: true,
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  });
  await audit({
    organizationId: ctx.activeOrg.id,
    actorId: ctx.user.id,
    action: "billing.checkout.mock",
    targetType: "plan",
    targetId: plan,
  });

  return NextResponse.redirect(new URL(redirectTo, req.url));
}
