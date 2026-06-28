"use client";

import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { adminGrantCredits } from "@/server/actions/admin";

type AdminOrg = { id: string; name: string; plan: string; balance: number };

export function OrgsTable({ orgs }: { orgs: AdminOrg[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function grant(orgId: string) {
    start(async () => {
      try {
        await adminGrantCredits(orgId, 1000);
        toast.success("Granted 1,000 credits");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organizations · {orgs.length}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {orgs.map((o) => (
          <div key={o.id} className="flex items-center gap-3 px-6 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{o.name}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(o.balance)} credits</p>
            </div>
            <Badge variant={o.plan === "free" ? "secondary" : "brand"} className="capitalize">
              {o.plan}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => grant(o.id)} disabled={pending}>
              <Gift className="size-3.5" /> +1k credits
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
