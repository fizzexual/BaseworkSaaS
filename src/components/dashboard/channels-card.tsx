import { Donut } from "@/components/charts/svg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export function ChannelsCard({
  title,
  segments,
}: {
  title: string;
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative shrink-0">
          <Donut segments={segments} size={150} thickness={20} />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-xl font-semibold tracking-tight">{formatNumber(total)}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">total</div>
            </div>
          </div>
        </div>
        <div className="w-full space-y-3">
          {segments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage yet.</p>
          ) : (
            segments.map((s) => {
              const pct = Math.round((s.value / total) * 100);
              return (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(s.value)} <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
