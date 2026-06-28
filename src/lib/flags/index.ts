import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { type FeatureFlag, featureFlagOverrides, featureFlags } from "@/lib/db/schema";
import { MODULES, type ModuleKey, moduleFlagKey } from "@/lib/modules";

/** Flags the app ships with. Upserted on first read in the admin panel. */
export const KNOWN_FLAGS: Record<string, string> = {
  "ai.assistant": "AI assistant chat",
  "billing.usage_overage": "Usage-based overage billing",
  "admin.impersonation": "Super-admin impersonation",
  "ai.byo_keys": "Bring-your-own provider keys",
  "modules.ai": "AI Assistant module (nav + routes)",
  "modules.billing": "Billing module (nav + routes)",
  "modules.members": "Members & teams module (nav + routes)",
  "modules.usage": "Usage & metering module (nav + routes)",
};

/** Flags enabled out of the box (modules are on by default). */
const DEFAULT_ON = new Set<string>([
  "ai.assistant",
  "billing.usage_overage",
  "admin.impersonation",
  ...MODULES.map(moduleFlagKey),
]);

function hashToPercent(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 100;
}

/** Resolve a flag for an optional org, honoring per-org overrides + rollout. */
export async function isEnabled(key: string, organizationId?: string): Promise<boolean> {
  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  if (!flag) return false;

  if (organizationId) {
    const [override] = await db
      .select()
      .from(featureFlagOverrides)
      .where(
        and(
          eq(featureFlagOverrides.flagKey, key),
          eq(featureFlagOverrides.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (override) return override.enabled;
  }

  if (flag.enabled) return true;
  if (flag.rolloutPercentage > 0 && organizationId) {
    return hashToPercent(`${key}:${organizationId}`) < flag.rolloutPercentage;
  }
  return false;
}

export async function listFlags(): Promise<FeatureFlag[]> {
  await ensureKnownFlags();
  return db.select().from(featureFlags).orderBy(asc(featureFlags.key));
}

export async function setFlag(key: string, enabled: boolean): Promise<void> {
  await db
    .update(featureFlags)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(featureFlags.key, key));
}

/**
 * Whether a feature module is enabled. A missing flag row counts as enabled, so
 * modules are on by default until a super-admin explicitly switches one off.
 */
export async function isModuleEnabled(module: ModuleKey): Promise<boolean> {
  const [flag] = await db
    .select({ enabled: featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, moduleFlagKey(module)))
    .limit(1);
  return flag ? flag.enabled : true;
}

/** Enabled-state for every module in one query (for the shell + admin UI). */
export async function getModuleStates(): Promise<Record<ModuleKey, boolean>> {
  await ensureKnownFlags();
  const rows = await db
    .select({ key: featureFlags.key, enabled: featureFlags.enabled })
    .from(featureFlags);
  const byKey = new Map(rows.map((r) => [r.key, r.enabled]));
  return Object.fromEntries(MODULES.map((m) => [m, byKey.get(moduleFlagKey(m)) ?? true])) as Record<
    ModuleKey,
    boolean
  >;
}

/** Idempotently insert any KNOWN_FLAGS rows that don't exist yet. */
export async function ensureKnownFlags(): Promise<void> {
  const existing = await db.select({ key: featureFlags.key }).from(featureFlags);
  const have = new Set(existing.map((r) => r.key));
  const missing = Object.entries(KNOWN_FLAGS).filter(([key]) => !have.has(key));
  if (missing.length === 0) return;
  await db
    .insert(featureFlags)
    .values(
      missing.map(([key, description]) => ({
        key,
        description,
        enabled: DEFAULT_ON.has(key),
      })),
    )
    // Concurrent first-load requests can race to seed the same keys; a duplicate
    // insert must be a no-op, not a primary-key violation.
    .onConflictDoNothing({ target: featureFlags.key });
}
