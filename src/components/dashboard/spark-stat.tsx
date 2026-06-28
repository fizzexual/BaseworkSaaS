import type { LucideIcon } from "lucide-react";
import { Sparkline } from "@/components/charts/svg";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SparkStat({
  label,
  value,
  delta,
  trend,
  color = "var(--color-primary)",
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: number;
  trend: number[];
  color?: string;
  icon?: LucideIcon;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        {typeof delta === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        ) : (
          <span />
        )}
        <div className="h-9 w-24 sm:w-28">
          <Sparkline data={trend} color={color} height={36} />
        </div>
      </div>
    </Card>
  );
}
