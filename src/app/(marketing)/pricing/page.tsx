import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { PlanCard } from "@/components/marketing/plan-card";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, usage-based pricing. Start free, then pay for the usage credits and seats you actually use.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really free to start?",
    a: "Yes. The Free plan includes 200 usage credits and up to 2 seats every month — no credit card required. The starter itself is open source under the MIT license, so you can clone and run the whole thing locally for $0.",
  },
  {
    q: "How does usage billing work?",
    a: "Credits are a generic metering primitive — any feature can charge them (the AI module is one example). Each plan includes a monthly bucket; when you exceed it, paid plans bill a small per-credit overage (just $0.01 / credit) so you never hit a hard wall. Usage is metered per organization and visible on your dashboard in real time.",
  },
  {
    q: "Can I self-host?",
    a: "Absolutely. Basework ships with embedded Postgres and mock providers, so `pnpm dev` runs with zero external accounts. Point it at your own Postgres, Stripe, and LLM keys and deploy anywhere that runs Node — Vercel, Fly, Railway, or your own box.",
  },
  {
    q: "What's the license?",
    a: "MIT. Use it for commercial products, modify it, and keep your changes private. No attribution required (though stars are appreciated).",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="grid-bg relative">
        <div className="container mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <Badge variant="outline" className="mx-auto gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Usage-based · No surprises
          </Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Pricing that scales with <span className="text-gradient">what you ship</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Start free and self-host forever. Upgrade when you need more seats, more usage credits,
            and production-grade support. Every plan is billed transparently — no per-seat traps.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto max-w-6xl px-6 pb-20">
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {PLAN_LIST.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All paid plans bill overage at $0.01 / credit. Prices in USD. Cancel anytime.
        </p>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Still curious? The answer is probably in the README.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card/40 px-6 py-5 transition-colors open:bg-card/70 hover:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
                {item.q}
                <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
