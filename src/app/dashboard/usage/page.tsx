import { desc, eq } from "drizzle-orm";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { usageEvents, users } from "@/lib/db/schema";
import { formatNumber } from "@/lib/utils";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Usage" };

const DAYS = 14;

export default async function UsagePage() {
  const ctx = await requireActiveOrg();

  const rows = await db
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
    .limit(100);

  const buckets = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    buckets.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    if (r.type !== "ai.chat") continue;
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(r.credits));
  }
  const chartData = [...buckets.entries()].map(([k, v]) => ({ label: k.slice(5), value: v }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Every AI call is metered and written to an append-only ledger.
        </p>
      </div>

      <UsageChart data={chartData} />

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
                      No usage yet — try the AI assistant.
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
