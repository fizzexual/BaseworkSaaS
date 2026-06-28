import { defineConfig } from "drizzle-kit";

/**
 * `pnpm db:generate` reads this and needs no live connection.
 * `pnpm db:studio` / `db:push` connect using DATABASE_URL (set a real Postgres
 * URL). In zero-config dev the embedded PGlite database is migrated + seeded
 * automatically at server startup (see src/lib/db/init.ts), so you rarely run
 * these directly.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/basework",
  },
  strict: true,
  verbose: true,
});
