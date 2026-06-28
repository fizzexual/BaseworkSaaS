import "./_load-env";
import { env, isProduction, runtimeModes } from "@/lib/env";

/** Prints which mode each subsystem is running in. */
function main() {
  console.log("\n  Basework — runtime configuration\n");
  const rows: [string, string][] = [
    ["NODE_ENV", env.NODE_ENV],
    ["Database", runtimeModes.db === "pglite" ? "embedded PGlite (dev)" : "Postgres"],
    ["Billing", runtimeModes.billing === "stripe" ? "Stripe" : "mock (simulated)"],
    ["AI", runtimeModes.ai === "live" ? "live provider" : "mock (deterministic)"],
    ["Email", runtimeModes.email === "resend" ? "Resend" : "console transport"],
    ["Rate limit", runtimeModes.rateLimit === "upstash" ? "Upstash Redis" : "in-memory"],
  ];
  for (const [k, v] of rows) console.log(`  ${k.padEnd(12)} ${v}`);
  console.log(`\n  Demo mode:   ${runtimeModes.demo ? "YES — fully zero-config" : "no"}`);

  if (isProduction) {
    const missing: string[] = [];
    if (!env.BETTER_AUTH_SECRET) missing.push("BETTER_AUTH_SECRET");
    if (!env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!env.ENCRYPTION_KEY) missing.push("ENCRYPTION_KEY");
    if (missing.length) console.log(`\n  ⚠ Missing in production: ${missing.join(", ")}`);
  }
  console.log("");
}

main();
