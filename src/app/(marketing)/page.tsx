import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  Check,
  CreditCard,
  Database,
  KeyRound,
  Lock,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PlanCard } from "@/components/marketing/plan-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PLAN_LIST } from "@/lib/billing/plans";
import { APP_DESCRIPTION, APP_GITHUB_URL, APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ─── Data ──────────────────────────────────────────────────────────────── */

const TRUST = ["Next.js 16", "Postgres", "Drizzle", "Better Auth", "Stripe", "AI SDK"];

const USE_CASES = ["a B2B tool", "a CRM", "an analytics app", "a dev platform", "an AI product"];

const FEATURES: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    icon: Shield,
    title: "Multi-tenant orgs & RBAC",
    description:
      "Organizations, invitations, and fine-grained role-based access control — wired up and enforced on every request.",
  },
  {
    icon: CreditCard,
    title: "Stripe billing done right",
    description:
      "Subscriptions, plan changes, and the proration edge cases — with webhook handlers that are actually tested.",
  },
  {
    icon: Activity,
    title: "Usage-based metering",
    description:
      "Meter any action — API calls, exports, AI tokens — as credits, enforce per-plan limits, and bill overage. The AI module is one example consumer.",
  },
  {
    icon: Lock,
    title: "Admin panel & impersonation",
    description:
      "A secure back office to inspect orgs, manage users, and safely impersonate accounts to debug support tickets.",
  },
  {
    icon: ScrollText,
    title: "Audit logs",
    description:
      "An append-only trail of who did what, when — across auth, billing, and admin actions. Compliance-ready.",
  },
  {
    icon: Activity,
    title: "Durable job queue",
    description:
      "A persistent, retrying background queue for emails, webhooks, and any long-running work that survives restarts.",
  },
  {
    icon: Bot,
    title: "Optional AI module",
    description:
      "A streaming assistant with bring-your-own keys, included as a deletable example of building a metered feature. Keep it or rip it out.",
  },
  {
    icon: Database,
    title: "Zero-config dev",
    description:
      "Embedded Postgres and mock providers mean `pnpm dev` just works — no Docker, no accounts, no keys.",
  },
  {
    icon: Boxes,
    title: "Type-safe end to end",
    description:
      "Strict TypeScript from the database to the UI, plus E2E tests so refactors don't break in production.",
  },
];

const STEPS: { command: string; title: string; description: string }[] = [
  {
    command: "git clone …/BaseworkSaaS",
    title: "Clone the repo",
    description: "Grab the MIT-licensed source. Everything you see on this page ships in the box.",
  },
  {
    command: "pnpm install && pnpm dev",
    title: "Run it instantly",
    description:
      "Boots with embedded Postgres and mock auth, billing, and AI providers — no accounts or keys needed.",
  },
  {
    command: "// add your product",
    title: "Build your thing",
    description:
      "Drop your features into the dashboard, flip on Stripe and a real database, and ship. The plumbing is done.",
  },
];

type Cell = "yes" | "no" | "partial";

const COMPARISON: {
  feature: string;
  basework: Cell;
  shipfast: Cell;
  makerkit: Cell;
  diy: Cell;
}[] = [
  {
    feature: "Usage-based metering & credits",
    basework: "yes",
    shipfast: "no",
    makerkit: "partial",
    diy: "no",
  },
  {
    feature: "Multi-tenant RBAC",
    basework: "yes",
    shipfast: "no",
    makerkit: "yes",
    diy: "partial",
  },
  {
    feature: "Admin impersonation",
    basework: "yes",
    shipfast: "no",
    makerkit: "partial",
    diy: "no",
  },
  { feature: "Zero-config demo", basework: "yes", shipfast: "partial", makerkit: "no", diy: "no" },
  {
    feature: "Tested Stripe webhooks",
    basework: "yes",
    shipfast: "partial",
    makerkit: "yes",
    diy: "no",
  },
  {
    feature: "100% open source (MIT)",
    basework: "yes",
    shipfast: "no",
    makerkit: "no",
    diy: "yes",
  },
];

const COMPARE_COLS = [
  { key: "shipfast", label: "ShipFast" },
  { key: "makerkit", label: "Makerkit" },
  { key: "diy", label: "Roll your own" },
] as const;

function CompareCell({ value }: { value: Cell }) {
  if (value === "yes")
    return <Check className="mx-auto size-5 text-primary" aria-label="Included" />;
  if (value === "partial")
    return (
      <span className="text-sm text-warning" role="img" aria-label="Partial">
        Partial
      </span>
    );
  return (
    <span className="text-muted-foreground/50" role="img" aria-label="Not included">
      —
    </span>
  );
}

/* ─── Faux dashboard preview ────────────────────────────────────────────── */

function DashboardPreview() {
  const stats = [
    { label: "MRR", value: "$48.2k", delta: "+12.4%" },
    { label: "Active orgs", value: "1,284", delta: "+8.1%" },
    { label: "Credits used", value: "312k", delta: "+24%" },
    { label: "Churn", value: "1.9%", delta: "−0.3%" },
  ];
  const bars = [
    { month: "jan", value: 42 },
    { month: "feb", value: 58 },
    { month: "mar", value: 47 },
    { month: "apr", value: 71 },
    { month: "may", value: 64 },
    { month: "jun", value: 83 },
    { month: "jul", value: 76 },
    { month: "aug", value: 95 },
    { month: "sep", value: 88 },
    { month: "oct", value: 64 },
    { month: "nov", value: 79 },
    { month: "dec", value: 92 },
  ];
  const sidebar = [
    { icon: Activity, label: "Overview", active: true },
    { icon: Boxes, label: "Your feature" },
    { icon: Users, label: "Members" },
    { icon: CreditCard, label: "Billing" },
    { icon: ScrollText, label: "Audit log" },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="glow pointer-events-none absolute -inset-x-10 -top-20 -bottom-10 -z-10"
      />
      <div className="glass overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/40">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-3 rounded-full bg-destructive/70" />
          <span className="size-3 rounded-full bg-warning/70" />
          <span className="size-3 rounded-full bg-success/70" />
          <div className="ml-3 inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground">
            app.yoursaas.com/dashboard
          </div>
        </div>

        <div className="grid grid-cols-[180px_1fr] md:grid-cols-[210px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-border bg-background/40 p-4 sm:flex">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="bg-brand inline-flex size-6 items-center justify-center rounded-md">
                <span className="size-2 rounded-[2px] bg-white/90" />
              </span>
              <span className="text-sm font-semibold">Acme Inc</span>
            </div>
            {sidebar.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                  item.active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </div>
            ))}
          </aside>

          {/* Main panel */}
          <div className="space-y-5 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overview</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <Badge variant="success" className="hidden sm:inline-flex">
                <span className="size-1.5 rounded-full bg-success" />
                Live
              </Badge>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-card/60 p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-success">{s.delta}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Usage this period</p>
                <span className="font-mono text-[11px] text-muted-foreground">312,480</span>
              </div>
              <div className="flex h-28 items-end gap-1.5">
                {bars.map((bar) => (
                  <div
                    key={bar.month}
                    className="bg-brand flex-1 rounded-t-sm opacity-80"
                    style={{ height: `${bar.value}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function MarketingHomePage() {
  return (
    <>
      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 -z-10" />
        <div className="container mx-auto max-w-6xl px-6 pt-20 text-center md:pt-28">
          <Badge variant="outline" className="animate-in-up mx-auto gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Open source · MIT
          </Badge>

          <h1 className="animate-in-up mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Everything your SaaS needs — <span className="text-gradient">except the product.</span>
          </h1>

          <p className="animate-in-up mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {APP_DESCRIPTION}
          </p>

          <div className="animate-in-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="brand" size="lg" asChild>
              <Link href={ROUTES.signUp}>
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={APP_GITHUB_URL} target="_blank" rel="noreferrer">
                <Star className="size-4 fill-warning text-warning" />
                Star on GitHub
              </a>
            </Button>
          </div>

          <p className="animate-in-up mt-6 font-mono text-xs text-muted-foreground">
            Bring {USE_CASES.join(" · ")} — the foundation is the same.
          </p>

          {/* Product preview */}
          <div className="animate-in-up mx-auto mt-16 max-w-5xl pb-4">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="border-y border-border bg-card/30">
        <div className="container mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground/70">
            Built on a modern, type-safe stack
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground sm:gap-x-8">
            {TRUST.map((tech, i) => (
              <span key={tech} className="flex items-center gap-6 sm:gap-8">
                {i > 0 && <span className="hidden text-border sm:inline">·</span>}
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES */}
      <section id="features" className="container mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="default">Everything included</Badge>
          <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            The hard parts, already built
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The unglamorous infrastructure every serious SaaS needs — production-grade, tested, and
            yours to extend. Stop rebuilding auth and billing for the tenth time and just build the
            product.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group transition-colors hover:border-primary/40 hover:bg-card/80"
            >
              <CardHeader className="gap-4">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <feature.icon className="size-5" />
                </span>
                <div className="space-y-2">
                  <h3 className="font-semibold tracking-tight">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="border-y border-border bg-card/20">
        <div className="container mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="default">Quickstart</Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
              From clone to your product in three steps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No setup wizard, no required accounts. It runs the moment you clone it.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-6">
                  <span className="bg-brand inline-flex size-9 items-center justify-center rounded-lg font-mono text-sm font-semibold text-white shadow-lg shadow-primary/20">
                    {i + 1}
                  </span>
                  <code className="block overflow-x-auto rounded-md border border-border bg-background/70 px-3 py-2 font-mono text-xs text-foreground">
                    $ {step.command}
                  </code>
                  <div>
                    <h3 className="font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COMPARISON */}
      <section id="comparison" className="container mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="default">Why {APP_NAME}</Badge>
          <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            Compare the alternatives
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Other starters get you a landing page and auth. {APP_NAME} gets you a complete,
            billable, multi-tenant SaaS — you just add the product.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-2/5 px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  Capability
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="bg-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white">
                    {APP_NAME}
                  </div>
                </th>
                {COMPARE_COLS.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-4 text-center text-sm font-medium text-muted-foreground"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, idx) => (
                <tr key={row.feature} className="group">
                  <td
                    className={cn(
                      "px-4 py-4 text-sm text-foreground",
                      idx !== 0 && "border-t border-border",
                    )}
                  >
                    {row.feature}
                  </td>
                  <td
                    className={cn(
                      "bg-primary/[0.06] px-4 py-4 text-center",
                      idx === 0 && "rounded-t-xl",
                      idx === COMPARISON.length - 1 && "rounded-b-xl",
                      idx !== 0 && "border-t border-primary/10",
                    )}
                  >
                    <CompareCell value={row.basework} />
                  </td>
                  {COMPARE_COLS.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-4 text-center", idx !== 0 && "border-t border-border")}
                    >
                      <CompareCell value={row[col.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. PRICING PREVIEW */}
      <section className="border-y border-border bg-card/20">
        <div className="container mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="default">Pricing</Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
              Free to start, fair as you scale
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Self-host for free, or let us run it. Usage-based credits mean you only pay for what
              your customers actually use.
            </p>
          </div>

          <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
            {PLAN_LIST.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="link" asChild>
              <Link href={ROUTES.pricing}>
                See full pricing &amp; FAQ
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="container mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="bg-brand relative overflow-hidden rounded-2xl px-8 py-16 text-center shadow-2xl shadow-primary/20 md:px-16 md:py-20">
          <div
            aria-hidden
            className="grid-bg pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
              Start building today
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
              Clone it, run it, and have a real multi-tenant SaaS on screen in minutes. Then make it
              yours.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="bg-white text-background hover:bg-white/90" asChild>
                <Link href={ROUTES.signUp}>
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                asChild
              >
                <a href={APP_GITHUB_URL} target="_blank" rel="noreferrer">
                  <Star className="size-4" />
                  Star on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
