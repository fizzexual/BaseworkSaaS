import { CheckCircle2, ExternalLink, Info } from "lucide-react";
import { PlanCards } from "@/components/dashboard/plan-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/billing/plans";
import { getBillingSummary } from "@/lib/billing/subscriptions";
import { billingMode } from "@/lib/env";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { openBillingPortal } from "@/server/actions/billing";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; canceled?: string }>;
}) {
  const ctx = await requireActiveOrg();
  const sp = await searchParams;
  const summary = await getBillingSummary(ctx.activeOrg.id);
  const plan = PLANS[summary.plan];
  const canManage = can(ctx.role, "billing:manage");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your plan, credits and invoices.</p>
      </div>

      {sp.upgraded && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-success">
            <CheckCircle2 className="size-4" /> Subscription updated — welcome to {plan.name}!
          </CardContent>
        </Card>
      )}

      {billingMode === "mock" && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
          <Info className="size-3.5 text-primary" />
          Demo billing — checkout is simulated and applies instantly. Set{" "}
          <span className="font-mono">STRIPE_*</span> env vars to use real Stripe (test or live).
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold capitalize">{plan.name}</span>
              <Badge variant={summary.plan === "free" ? "secondary" : "brand"}>
                {summary.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(plan.priceMonthly)}/mo · {summary.seats} seat
              {summary.seats === 1 ? "" : "s"}
            </p>
            {summary.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Renews {formatDate(summary.currentPeriodEnd)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI credits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">{formatNumber(summary.balance)}</div>
            <p className="text-sm text-muted-foreground">
              of {formatNumber(summary.includedMonthly)} included
            </p>
            {summary.overage > 0 && (
              <p className="text-xs text-warning">
                {formatNumber(summary.overage)} credits overage
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Update payment method, download invoices, or cancel.
            </p>
            <form action={openBillingPortal}>
              <Button type="submit" variant="outline" size="sm" disabled={!canManage}>
                Open portal <ExternalLink className="size-3.5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Plans</h2>
        <PlanCards currentPlan={summary.plan} canManage={canManage} />
        {!canManage && (
          <p className="mt-3 text-xs text-muted-foreground">
            Only owners and admins can change the plan.
          </p>
        )}
      </div>
    </div>
  );
}
