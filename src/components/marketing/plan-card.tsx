import { Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Plan } from "@/lib/billing/plans";
import { ROUTES } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export function PlanCard({ plan }: { plan: Plan }) {
  const seatsLabel = plan.seats === null ? "Unlimited seats" : `Up to ${plan.seats} seats`;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col",
        plan.popular && "ring-2 ring-primary shadow-xl shadow-primary/10",
      )}
    >
      {plan.popular && (
        <Badge variant="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most popular
        </Badge>
      )}

      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        <div className="flex items-baseline gap-1 pt-2">
          <span className="text-4xl font-bold tracking-tight">
            {formatCurrency(plan.priceMonthly)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatNumber(plan.includedCredits)} AI credits · {seatsLabel}
        </p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button variant={plan.popular ? "brand" : "outline"} className="w-full" asChild>
          <Link href={ROUTES.signUp}>
            {plan.priceMonthly === 0 ? "Start for free" : `Get ${plan.name}`}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
