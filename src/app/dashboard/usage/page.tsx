import { and, desc, eq, gte } from "drizzle-orm";
import { Bot, CalendarDays, Coins, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { TrendChart } from "@/components/charts/svg";
import { SparkStat } from "@/components/dashboard/spark-stat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { usageEvents, users } from "@/lib/db/schema";
import { isModuleEnabled } from "@/lib/flags";
import { formatNumber } from "@/lib/utils";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Usage" };

const DAYS = 30;
const consumed = (c: number) => (c < 0 ? -c : 0);

export default async function UsagePage() {
  if (!(await isModuleEnabled("usage"))) redirect("/dashboard");
  const ctx = await requireActiveOrg();
  const now = Date.now();

  const [rows, events] = await Promise.all([
    db
      .select({
        id: usageEvents.id,
        type: usageEvents.type,
        model: usageEvents.model,
        inputTokens: usageEvents.inputTokens,
        outputTokens: usageEvents.outputTokens,
        credits: usageEvents.credits,
        createdAt: usageEvents.createdAt,
        userName: users.name,
      })
      .from(usageEvents)
      .leftJoin(users, eq(usageEvents.userId, users.id))
      .where(eq(usageEvents.organizationId, ctx.activeOrg.id))
      .orderBy(desc(usageEvents.createdAt))
      .limit(100),
    db
      .select({
        type: usageEvents.type,
        credits: usageEvents.credits,
        inputTokens: usageEvents.inputTokens,
        outputTokens: usageEvents.outputTokens,
        createdAt: usageEvents.createdAt,
      })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.organizationId, ctx.activeOrg.id),
          gte(usageEvents.createdAt, new Date(now - DAYS * 86_400_000)),
        ),
      ),
  ]);

  const keys = Array.from({ length: DAYS }, (_, i) =>
    new Date(now - (DAYS - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
  const credits = new Map(keys.map((k): [string, number] => [k, 0]));
  const messages = new Map(keys.map((k): [string, number] => [k, 0]));
  const tokens = new Map(keys.map((k): [string, number] => [k, 0]));

  let creditsUsed = 0;
  let aiMessages = 0;
  let totalTokens = 0;
  for (const e of events) {
    const k = new Date(e.createdAt).toISOString().slice(0, 10);
    creditsUsed += consumed(e.credits);
    totalTokens += e.inputTokens + e.outputTokens;
    if (e.type === "ai.chat") aiMessages += 1;
    if (!credits.has(k)) continue;
    credits.set(k, (credits.get(k) ?? 0) + consumed(e.credits));
    tokens.set(k, (tokens.get(k) ?? 0) + e.inputTokens + e.outputTokens);
    if (e.type === "ai.chat") messages.set(k, (messages.get(k) ?? 0) + 1);
  }

  const dailyCredits = keys.map((k) => credits.get(k) ?? 0);
  const dailyMessages = keys.map((k) => messages.get(k) ?? 0);
  const dailyTokens = keys.map((k) => tokens.get(k) ?? 0);
  const activeDays = dailyCredits.filter((v) => v > 0).length;
  const labels = keys.map((k) => k.slice(5));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Every metered action is written to an append-only ledger. Last {DAYS} days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SparkStat
          label="Credits used"
          value={formatNumber(creditsUsed)}
          trend={dailyCredits}
          color="var(--brand-1)"
          icon={Zap}
        />
        <SparkStat
          label="AI messages"
          value={formatNumber(aiMessages)}
          trend={dailyMessages}
          color="var(--brand-3)"
          icon={Bot}
        />
        <SparkStat
          label="Tokens processed"
          value={formatNumber(totalTokens)}
          trend={dailyTokens}
          color="var(--brand-2)"
          icon={Coins}
        />
        <SparkStat
          label="Active days"
          value={`${activeDays} / ${DAYS}`}
          trend={dailyCredits.map((v) => (v > 0 ? 1 : 0))}
          color="var(--color-muted-foreground)"
          icon={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Daily usage</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: "var(--brand-1)" }} />
              Credits
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: "var(--brand-3)" }} />
              Messages
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <TrendChart
            series={[
              { name: "Credits", color: "var(--brand-1)", data: dailyCredits },
              { name: "Messages", color: "var(--brand-3)", data: dailyMessages },
            ]}
            height={220}
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{labels[0]}</span>
            <span>{labels[Math.floor(labels.length / 2)]}</span>
            <span>{labels[labels.length - 1]}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">When</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Model</th>
                  <th className="px-6 py-3 text-right font-medium">Tokens</th>
                  <th className="px-6 py-3 text-right font-medium">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No usage yet — try the example AI assistant.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">{r.userName ?? "—"}</td>
                      <td className="px-6 py-3">
                        <Badge variant={r.type === "ai.chat" ? "secondary" : "success"}>
                          {r.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {r.model ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">
                        {r.inputTokens + r.outputTokens > 0
                          ? `${formatNumber(r.inputTokens)}/${formatNumber(r.outputTokens)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        <span className={r.credits < 0 ? "text-foreground" : "text-success"}>
                          {r.credits > 0 ? `+${r.credits}` : r.credits}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
