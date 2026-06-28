import { PGlite } from "@electric-sql/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { dbMode, env } from "@/lib/env";
import * as schema from "./schema";

/**
 * The database client.
 *
 * Server-only. In zero-config dev (`DATABASE_URL` unset) this is an embedded
 * PGlite (Postgres-in-process, persisted to ./.pglite). In production it is a
 * pooled node-postgres connection. Both expose the identical Drizzle API, so
 * the rest of the app is driver-agnostic — we type everything as the
 * node-postgres flavour for a single, stable surface.
 */
export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __baseworkDb?: Database;
  __baseworkPglite?: PGlite;
};

function createDatabase(): Database {
  if (dbMode === "pglite") {
    const client =
      globalForDb.__baseworkPglite ?? new PGlite(process.env.PGLITE_PATH ?? "./.pglite");
    globalForDb.__baseworkPglite = client;
    return drizzlePglite(client, { schema }) as unknown as Database;
  }
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return drizzleNodePg(pool, { schema });
}

export const db: Database = globalForDb.__baseworkDb ?? createDatabase();

// Reuse the instance across HMR reloads in dev to avoid exhausting connections
// and to keep the single in-process PGlite alive.
if (env.NODE_ENV !== "production") globalForDb.__baseworkDb = db;

export { schema };
