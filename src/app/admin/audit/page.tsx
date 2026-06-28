import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Immutable record of sensitive actions across all organizations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity · {rows.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">When</th>
                  <th className="px-6 py-3 font-medium">Actor</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No audit entries yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={r.actorType === "admin" ? "default" : "secondary"}>
                          {r.actorType}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">{r.action}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {r.targetType ? `${r.targetType}:${r.targetId ?? "—"}` : "—"}
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
