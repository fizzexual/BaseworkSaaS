import { and, eq, gte } from "drizzle-orm";
import { Activity, Bot, Boxes, CreditCard, Users, Zap } from "lucide-react";
import Link from "next/link";
import { CreditMeter } from "@/components/dashboard/credit-meter";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBillingSummary } from "@/lib/billing/subscriptions";
import { APP_GITHUB_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { members, usageEvents } from "@/lib/db/schema";
import { formatNumber, titleCase } from "@/lib/utils";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Overview" };

const DAYS = 14;

export default async function OverviewPage() {
  const ctx = await requireActiveOrg();
  const org = ctx.activeOrg;
  const since = new Date(Date.now() - DAYS * 86_400_000);

  const [summary, memberRows, usage] = await Promise.all([
    getBillingSummary(org.id),
    db.select({ id: members.id }).from(members).where(eq(members.organizationId, org.id)),
    db
      .select()
      .from(usageEvents)
      .where(and(eq(usageEvents.organizationId, org.id), gte(usageEvents.createdAt, since))),
  ]);

  const buckets = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    buckets.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  let usedThisWindow = 0;
  for (const u of usage) {
    if (u.credits >= 0) continue;
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(u.credits));
    usedThisWindow += Math.abs(u.credits);
  }
  const chartData = [...buckets.entries()].map(([k, v]) => ({ label: k.slice(5), value: v }));
  const usedThisPeriod = Math.max(0, summary.includedMonthly - summary.balance) + summary.overage;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening in <span className="text-foreground">{org.name}</span>.
          </p>
        </div>
        <Badge variant={summary.plan === "free" ? "secondary" : "brand"} className="capitalize">
          {summary.plan} plan · {summary.status}
        </Badge>
      </div>

      {/* "you bring the product" cue — this is a template, not a finished app */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 text-sm">
        <Boxes className="size-4 shrink-0 text-primary" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">This is your starting point.</span> Teams,
          billing, usage metering and admin are wired up — add your product's pages here. The AI
          assistant is an example module you can delete.
        </span>
        <a
          href={APP_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto font-medium text-primary hover:underline"
        >
          Read the docs →
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Plan"
          value={titleCase(summary.plan)}
          hint={`${summary.seats} seat${summary.seats === 1 ? "" : "s"}`}
          icon={CreditCard}
        />
        <StatCard label="Members" value={memberRows.length} hint="in this org" icon={Users} />
        <StatCard
          label="Credits left"
          value={formatNumber(summary.balance)}
          hint={`of ${formatNumber(summary.includedMonthly)} / period`}
          icon={Zap}
        />
        <StatCard
          label="Used (period)"
          value={formatNumber(usedThisPeriod)}
          hint={`${formatNumber(usedThisWindow)} in last ${DAYS}d`}
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageChart data={chartData} />
        </div>
        <CreditMeter
          balance={summary.balance}
          included={summary.includedMonthly}
          overage={summary.overage}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/dashboard/ai"
          title="AI assistant (example)"
          description="An example metered feature — stream a reply and watch usage credits tick down."
          icon={Bot}
        />
        <QuickAction
          href="/dashboard/members"
          title="Invite your team"
          description="Add members and assign fine-grained roles."
          icon={Users}
        />
        <QuickAction
          href="/dashboard/billing"
          title="Manage billing"
          description="Upgrade your plan or open the customer portal."
          icon={CreditCard}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Bot;
}) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader>
        <Icon className="size-5 text-primary" />
        <CardTitle className="mt-2 text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
