# Security Policy

Basework is a starter template. When you build on it, **you** are responsible for
the security of your deployment. A few things the template does to help:

- Secrets are read from the environment and never committed (`.env` is gitignored).
- BYO provider keys are encrypted at rest (AES-256-GCM, see `src/lib/crypto.ts`).
- All tenant-scoped queries are filtered by `organizationId`; isolation is covered
  by tests (`tests/integration/isolation.test.ts`).
- Stripe webhooks are signature-verified before any database write.
- Sensitive actions are written to an immutable audit log.

## Before going to production

- Set a strong `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`.
- Use a managed Postgres (`DATABASE_URL`) — the embedded PGlite is for local dev only.
- Restrict `SUPER_ADMIN_EMAILS` to addresses you control.
- Run migrations in your deploy pipeline (`pnpm db:migrate`).

## Reporting a vulnerability

If you find a security issue in the template itself, please open a
[GitHub security advisory](https://github.com/fizzexual/BaseworkSaaS/security/advisories/new)
or email the maintainer rather than filing a public issue. We'll respond as quickly
as we can.
