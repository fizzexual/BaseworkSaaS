"use client";

import { useState } from "react";
import { TrendChart } from "@/components/charts/svg";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Range = "day" | "week" | "month";
export type RangeSeries = { credits: number[]; messages: number[]; labels: string[] };

const RANGES: Range[] = ["day", "week", "month"];

export function MetricsPanel({
  title,
  subtitle,
  kpis,
  ranges,
}: {
  title: string;
  subtitle: string;
  kpis: { label: string; value: string }[];
  ranges: Record<Range, RangeSeries>;
}) {
  const [range, setRange] = useState<Range>("day");
  const s = ranges[range];
  const series = [
    { name: "Credits", color: "var(--brand-1)", data: s.credits },
    { name: "Messages", color: "var(--brand-3)", data: s.messages },
  ];
  const mid = Math.floor(s.labels.length / 2);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5 text-sm">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-3 py-1 capitalize transition-colors",
                  range === r
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
          {kpis.map((k) => (
            <div key={k.label}>
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-xl font-semibold tracking-tight">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: "var(--brand-1)" }} />{" "}
            Credits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: "var(--brand-3)" }} />{" "}
            Messages
          </span>
        </div>

        <TrendChart series={series} height={240} className="mt-2" />

        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{s.labels[0]}</span>
          {s.labels.length > 2 && <span>{s.labels[mid]}</span>}
          <span>{s.labels[s.labels.length - 1]}</span>
        </div>
      </CardContent>
    </Card>
  );
}
