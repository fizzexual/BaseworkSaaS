<div align="center">

# Basework

### The advanced, AI-native, multi-tenant SaaS starter.

Auth · Organizations & fine-grained RBAC · Stripe billing · **usage-based AI credit metering** · admin panel with impersonation · audit logs · durable jobs — and it **runs with zero configuration.**

[![CI](https://github.com/fizzexual/BaseworkSaaS/actions/workflows/ci.yml/badge.svg)](https://github.com/fizzexual/BaseworkSaaS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-8b5cf6.svg)](./LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-db2777)

<br/>

<img src="./docs/screenshots/dashboard.png" alt="Basework dashboard" width="100%"/>

</div>

---

## Why Basework?

Most SaaS boilerplates hand you auth and a Stripe button, then fake the hard parts. Basework is built around the parts people actually struggle with:

- 🤖 **AI-native billing that actually works.** Every AI call is metered against per-org **credits**; overage is reported to Stripe as usage. This is the wedge — almost no template ships it.
- 🏢 **Real multi-tenancy.** Organizations, members, invitations, and a **fine-grained permission policy** (not bare role strings). Tenant isolation is covered by tests.
- 💳 **Billing done right.** Checkout → **signature-verified webhook → database** sync, customer portal, plan changes that reset credits. The "everyone fakes it" part is real and tested.
- 🛡️ **Admin panel with secure impersonation**, feature flags, and an immutable **audit log**.
- ⚡ **Zero-config dev.** `pnpm dev` boots a fully seeded demo with **no accounts and no keys** — embedded Postgres (PGlite), plus mock email / billing / AI providers. Flip to production by filling `.env`.
- ✅ **Genuinely tested.** Typecheck, lint, unit + integration (in-memory Postgres), and Playwright E2E — all in CI with no external services.

> **The 30-second pitch:** clone it, run `pnpm dev`, and you have a streaming AI assistant that meters credits, a multi-tenant dashboard, and a working billing flow — before you've created a single account anywhere.

## Quickstart

```bash
git clone https://github.com/fizzexual/BaseworkSaaS.git
cd BaseworkSaaS
pnpm install
pnpm dev
```

Open **http://localhost:3000** and sign in with the seeded demo accounts:

| Account | Email | Password | Role |
| --- | --- | --- | --- |
| Owner / super-admin | `admin@basework.dev` | `password123` | owner + admin |
| Member | `member@basework.dev` | `password123` | member |

No `.env`, no database, no Stripe account, no API keys. It just runs.

## Screenshots

| AI assistant (streamed + metered) | Billing & plans |
| --- | --- |
| <img src="./docs/screenshots/ai-chat.png" width="100%"/> | <img src="./docs/screenshots/billing.png" width="100%"/> |

| Usage ledger | Admin panel |
| --- | --- |
| <img src="./docs/screenshots/usage.png" width="100%"/> | <img src="./docs/screenshots/admin.png" width="100%"/> |

## Stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, RSC, Server Actions), React 19, TypeScript (strict) |
| UI | Tailwind CSS v4, Radix primitives, a dark premium design system |
| Database | **Drizzle ORM** — embedded **PGlite** in dev ↔ **Postgres / Neon** in prod |
| Auth | **Better Auth** — email+password, OAuth, organizations, admin + impersonation |
| Billing | **Stripe** (subscriptions + usage metering) behind a provider interface, with a mock provider for zero-config |
| AI | **Vercel AI SDK** — streaming chat, credit metering, bring-your-own keys; mock provider when no key |
| Infra | durable job queue, feature flags, per-plan rate limiting, structured logging, audit log, React Email + Resend |
| Tooling | Biome, Vitest, Playwright, GitHub Actions |

## How it works

Basework has **two modes**, chosen automatically from the environment:

```
DATABASE_URL empty   → embedded PGlite (Postgres in-process)   |  set it → Postgres / Neon
STRIPE_SECRET_KEY    → mock billing (simulated checkout)        |  set it → real Stripe
OPENAI/ANTHROPIC key → mock AI (deterministic streaming)        |  set it → real LLM
RESEND_API_KEY empty → console email transport                  |  set it → Resend
```

The credit-metering flow is the heart of it:

```
chat request → check org credit balance / plan overage policy
            → stream the model response (Vercel AI SDK)
            → on finish: count tokens → deduct credits (atomic, ledgered)
            → report overage to Stripe as a metered usage event
```

## Going to production

1. Copy `.env.example` to `.env` and fill the values.
2. Provision Postgres (e.g. [Neon](https://neon.tech)) and set `DATABASE_URL`.
3. `pnpm db:migrate` to apply migrations.
4. Create Stripe products/prices (`pnpm stripe:sync`) and set `STRIPE_*`.
5. Set `BETTER_AUTH_SECRET`, `ENCRYPTION_KEY`, and an LLM key.
6. Deploy. Point a cron at `POST /api/jobs/tick` to drain the job queue.

Run `pnpm doctor` anytime to see which mode each subsystem is in.

## Project structure

```
src/
  app/
    (marketing)/         # landing + pricing
    (auth)/              # sign-in / sign-up / accept-invitation
    dashboard/           # app shell: overview, ai, members, usage, billing, settings
    admin/               # super-admin: users, flags, audit
    api/                 # better-auth, stripe webhook, ai chat, jobs
  lib/
    auth/ db/ billing/ ai/ rbac/ email/ jobs/ flags/ ratelimit/ observability/ env
  server/                # request context + server actions
drizzle/                 # schema migrations
tests/                   # vitest (unit + integration) and playwright (e2e)
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the app (zero-config) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix |
| `pnpm test` | Vitest (in-memory Postgres) |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm db:generate` / `pnpm db:migrate` | Drizzle migrations |
| `pnpm stripe:sync` | Create Stripe products/prices/meters |
| `pnpm doctor` | Print the active runtime modes |

## How it compares

| | **Basework** | Typical boilerplate |
| --- | :---: | :---: |
| Usage-based **AI credit metering** | ✅ | ❌ |
| Multi-tenant orgs + **fine-grained RBAC** | ✅ | partial |
| Admin **impersonation** | ✅ | ❌ |
| **Tested** Stripe webhook sync | ✅ | ❌ |
| **Zero-config** runnable demo | ✅ | ❌ |
| Audit log + durable jobs | ✅ | rare |
| 100% open source (MIT) | ✅ | varies |

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Please keep
`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` green.

## License

[MIT](./LICENSE) — use it for anything, including commercial products.
