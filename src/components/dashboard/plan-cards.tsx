"use client";

import { Check, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LIST } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/db/schema";
import { cn, formatCurrency } from "@/lib/utils";
import { startCheckout } from "@/server/actions/billing";

export function PlanCards({ currentPlan, canManage }: { currentPlan: PlanId; canManage: boolean }) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLAN_LIST.map((p) => {
        const current = p.id === currentPlan;
        return (
          <Card key={p.id} className={cn("flex flex-col", p.popular && "ring-1 ring-primary")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                {p.popular && <Badge variant="brand">Popular</Badge>}
              </div>
              <div className="mt-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {formatCurrency(p.priceMonthly)}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <ul className="flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              {current ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  variant={p.popular ? "brand" : "outline"}
                  className="w-full"
                  disabled={!canManage || pending}
                  onClick={() => start(() => startCheckout(p.id))}
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Choose {p.name}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
