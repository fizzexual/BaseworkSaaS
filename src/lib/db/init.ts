import path from "node:path";
import { dbMode, isProduction, runtimeModes } from "@/lib/env";
import { scopedLogger } from "@/lib/observability/logger";
import { db } from "./index";
import { organizations } from "./schema";

const log = scopedLogger("db");
let readyPromise: Promise<void> | null = null;

/** Idempotent: migrate (and in dev, seed) the database exactly once per process. */
export function ensureDatabaseReady() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

async function init() {
  try {
    if (isProduction && dbMode === "postgres") {
      // Production migrations run in your deploy pipeline (`pnpm db:migrate`).
      return;
    }
    await runMigrations();
    if (dbMode === "pglite") await seedIfEmpty();
    log.info({ modes: runtimeModes }, "database ready");
  } catch (err) {
    log.error({ err }, "database init failed");
    throw err;
  }
}

async function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (dbMode === "pglite") {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db as never, { migrationsFolder });
  }
}

async function seedIfEmpty() {
  const existing = await db.select({ id: organizations.id }).from(organizations).limit(1);
  if (existing.length > 0) return;
  const { seedDemoData } = await import("./seed");
  await seedDemoData();
  log.info("seeded demo data");
}
