import { and, eq, gte } from "drizzle-orm";
import { Bot, CreditCard, MessageSquare, Users, Zap } from "lucide-react";
import Link from "next/link";
import { ChannelsCard } from "@/components/dashboard/channels-card";
import { CreditMeter } from "@/components/dashboard/credit-meter";
import { MetricsPanel, type RangeSeries } from "@/components/dashboard/metrics-panel";
import { SparkStat } from "@/components/dashboard/spark-stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBillingSummary } from "@/lib/billing/subscriptions";
import { APP_GITHUB_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { members, usageEvents, users } from "@/lib/db/schema";
import { getModuleStates } from "@/lib/flags";
import { formatNumber } from "@/lib/utils";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Overview" };

const consumed = (c: number) => (c < 0 ? -c : 0);
const dayKey = (d: Date | string | number) => new Date(d).toISOString().slice(0, 10);
const monthKey = (d: Date | string | number) => new Date(d).toISOString().slice(0, 7);
const weekKey = (d: Date | string | number) => {
  const x = new Date(d);
  const dow = (x.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate() - dow))
    .toISOString()
    .slice(0, 10);
};

function pctChange(arr: number[]): number {
  const h = Math.floor(arr.length / 2);
  const recent = arr.slice(h).reduce((a, b) => a + b, 0);
  const prev = arr.slice(0, h).reduce((a, b) => a + b, 0);
  if (prev === 0) return recent > 0 ? 100 : 0;
  return ((recent - prev) / prev) * 100;
}

export default async function OverviewPage() {
  const ctx = await requireActiveOrg();
  const org = ctx.activeOrg;
  const now = Date.now();

  const [summary, memberRows, usage, memberUsers, moduleStates] = await Promise.all([
    getBillingSummary(org.id),
    db.select({ id: members.id }).from(members).where(eq(members.organizationId, org.id)),
    db
      .select({
        type: usageEvents.type,
        credits: usageEvents.credits,
        userId: usageEvents.userId,
        createdAt: usageEvents.createdAt,
      })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.organizationId, org.id),
          gte(usageEvents.createdAt, new Date(now - 200 * 86_400_000)),
        ),
      ),
    db
      .select({ userId: members.userId, name: users.name })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.organizationId, org.id)),
    getModuleStates(),
  ]);

  const buildSeries = (
    keys: string[],
    keyFn: (d: Date) => string,
    labelFn: (k: string) => string,
  ): RangeSeries => {
    const credits = new Map(keys.map((k): [string, number] => [k, 0]));
    const messages = new Map(keys.map((k): [string, number] => [k, 0]));
    for (const e of usage) {
      const k = keyFn(e.createdAt);
      if (!credits.has(k)) continue;
      credits.set(k, (credits.get(k) ?? 0) + consumed(e.credits));
      if (e.type === "ai.chat") messages.set(k, (messages.get(k) ?? 0) + 1);
    }
    return {
      credits: keys.map((k) => credits.get(k) ?? 0),
      messages: keys.map((k) => messages.get(k) ?? 0),
      labels: keys.map(labelFn),
    };
  };

  const dayKeys = Array.from({ length: 14 }, (_, i) => dayKey(now - (13 - i) * 86_400_000));
  const weekKeys = Array.from({ length: 12 }, (_, i) => weekKey(now - (11 - i) * 7 * 86_400_000));
  const monthKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    return monthKey(d);
  });

  const ranges = {
    day: buildSeries(
      dayKeys,
      (d) => dayKey(d),
      (k) => k.slice(5),
    ),
    week: buildSeries(weekKeys, weekKey, (k) => k.slice(5)),
    month: buildSeries(monthKeys, monthKey, (k) =>
      new Date(`${k}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short" }),
    ),
  };

  const creditsUsed14 = ranges.day.credits.reduce((a, b) => a + b, 0);
  const messages14 = ranges.day.messages.reduce((a, b) => a + b, 0);
  const usedThisPeriod = Math.max(0, summary.includedMonthly - summary.balance) + summary.overage;

  let running = summary.balance + creditsUsed14;
  const balanceTrend = ranges.day.credits.map((c) => {
    running -= c;
    return Math.max(0, running);
  });

  // Credits by member (donut).
  const nameById = new Map(memberUsers.map((m): [string, string] => [m.userId, m.name]));
  const byUser = new Map<string, number>();
  for (const e of usage) {
    if (e.userId && e.credits < 0)
      byUser.set(e.userId, (byUser.get(e.userId) ?? 0) + consumed(e.credits));
  }
  const palette = ["var(--brand-1)", "var(--brand-3)", "var(--brand-2)", "#8b7bff", "#43d6e3"];
  const segments = [...byUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uid, value], i) => ({
      label: nameById.get(uid) ?? "Unknown",
      value,
      color: palette[i % palette.length] ?? "var(--brand-1)",
    }));

  const kpis = [
    { label: "Credits used (14d)", value: formatNumber(creditsUsed14) },
    { label: "AI messages (14d)", value: formatNumber(messages14) },
    { label: "Avg / day", value: formatNumber(Math.round(creditsUsed14 / 14)) },
    { label: "Members", value: String(memberRows.length) },
  ];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SparkStat
          label="Credits used"
          value={formatNumber(usedThisPeriod)}
          delta={pctChange(ranges.day.credits)}
          trend={ranges.day.credits}
          color="var(--brand-1)"
          icon={Zap}
        />
        <SparkStat
          label="AI messages"
          value={formatNumber(messages14)}
          delta={pctChange(ranges.day.messages)}
          trend={ranges.day.messages}
          color="var(--brand-3)"
          icon={Bot}
        />
        <SparkStat
          label="Credits left"
          value={formatNumber(summary.balance)}
          trend={balanceTrend}
          color="var(--brand-2)"
          icon={CreditCard}
        />
        <SparkStat
          label="Members"
          value={String(memberRows.length)}
          trend={ranges.day.messages.map(() => memberRows.length)}
          color="var(--color-muted-foreground)"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MetricsPanel
            title="Usage metrics"
            subtitle="Credits consumed and AI messages over the selected range."
            kpis={kpis}
            ranges={ranges}
          />
        </div>
        <div className="flex flex-col gap-4">
          <CreditMeter
            balance={summary.balance}
            included={summary.includedMonthly}
            overage={summary.overage}
          />
          <ChannelsCard title="Credits by member" segments={segments} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {moduleStates.ai && (
          <QuickAction
            href="/dashboard/ai"
            title="AI assistant (example)"
            description="An example metered feature — stream a reply and watch usage credits tick down."
            icon={Bot}
          />
        )}
        {moduleStates.members && (
          <QuickAction
            href="/dashboard/members"
            title="Invite your team"
            description="Add members and assign fine-grained roles."
            icon={Users}
          />
        )}
        {moduleStates.billing && (
          <QuickAction
            href="/dashboard/billing"
            title="Manage billing"
            description="Upgrade your plan or open the customer portal."
            icon={CreditCard}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 text-sm">
        <MessageSquare className="size-4 shrink-0 text-primary" />
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
