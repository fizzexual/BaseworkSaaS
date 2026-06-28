import path from "node:path";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll } from "vitest";
import { db } from "@/lib/db";

// Each test file gets a fresh in-memory PGlite database; migrate it once.
beforeAll(async () => {
  await migrate(db as never, { migrationsFolder: path.join(process.cwd(), "drizzle") });
});
