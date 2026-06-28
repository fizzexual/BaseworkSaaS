import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";

export function CreditMeter({
  balance,
  included,
  overage,
}: {
  balance: number;
  included: number;
  overage: number;
}) {
  const used = Math.max(0, included - balance);
  const pct = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Usage credits</CardTitle>
        {overage > 0 && <Badge variant="warning">+{formatNumber(overage)} overage</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight">{formatNumber(balance)}</span>
          <span className="pb-1 text-sm text-muted-foreground">
            / {formatNumber(included)} remaining
          </span>
        </div>
        <Progress value={pct} />
        <p className="text-xs text-muted-foreground">
          {formatNumber(used)} credits used this billing period.
        </p>
      </CardContent>
    </Card>
  );
}
