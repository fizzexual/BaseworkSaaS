# Contributing to Basework

Thanks for your interest! Basework is an open-source SaaS starter — contributions
that make it a better foundation are very welcome.

## Getting started

```bash
pnpm install
pnpm dev          # zero-config: embedded Postgres + mock providers, seeded demo
```

Open http://localhost:3000 and sign in with `admin@basework.dev` / `password123`.

## Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the app (zero-config) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix |
| `pnpm test` | Vitest unit + integration (in-memory PGlite) |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm db:generate` | Generate a Drizzle migration after editing the schema |
| `pnpm build` | Production build |

## Conventions

- **TypeScript everywhere**, strict mode. Keep `pnpm typecheck` green.
- **Biome** for formatting and linting (`pnpm lint:fix` before committing).
- **Conventional Commits** for messages (`feat:`, `fix:`, `docs:`, `chore:` …).
- After changing `src/lib/db/schema.ts`, run `pnpm db:generate` and commit the
  generated SQL in `drizzle/`.
- Add tests for new business logic (billing, metering, RBAC, isolation).

## Pull requests

1. Branch off `main`.
2. Make sure `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` all pass.
3. Open a PR describing the change. CI runs the same checks.

By contributing you agree your work is licensed under the project's [MIT License](./LICENSE).
