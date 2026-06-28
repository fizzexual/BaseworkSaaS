import { FlagToggle } from "@/components/admin/flag-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listFlags } from "@/lib/flags";

export const metadata = { title: "Feature flags" };

export default async function FlagsPage() {
  const flags = await listFlags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feature flags</h1>
        <p className="text-sm text-muted-foreground">
          Toggle capabilities globally. Per-org overrides + percentage rollout are supported in the
          flags API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flags · {flags.length}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {flags.map((f) => (
            <div key={f.key} className="flex items-center gap-3 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm">{f.key}</p>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
              <FlagToggle flagKey={f.key} enabled={f.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
