import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HEIGHT = 150;

export function UsageChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage · last 14 days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5" style={{ height: HEIGHT }}>
          {data.map((d) => (
            <div
              key={d.label}
              className="flex-1 rounded-t bg-brand opacity-80 transition-opacity hover:opacity-100"
              style={{
                height: Math.max(d.value > 0 ? 6 : 2, Math.round((d.value / max) * HEIGHT)),
              }}
              title={`${d.label}: ${d.value} credits`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
