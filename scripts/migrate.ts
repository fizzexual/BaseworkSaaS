import "./_load-env";
import path from "node:path";
import { db } from "@/lib/db";
import { dbMode } from "@/lib/env";

/** Applies Drizzle migrations to the configured database. */
async function main() {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (dbMode === "pglite") {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db as never, { migrationsFolder });
  }
  console.log("✓ migrations applied");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
