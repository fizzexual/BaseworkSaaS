import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { type FeatureFlag, featureFlagOverrides, featureFlags } from "@/lib/db/schema";

/** Flags the app ships with. Upserted on first read in the admin panel. */
export const KNOWN_FLAGS: Record<string, string> = {
  "ai.assistant": "AI assistant chat",
  "billing.usage_overage": "Usage-based overage billing",
  "admin.impersonation": "Super-admin impersonation",
  "ai.byo_keys": "Bring-your-own provider keys",
};

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

/** Idempotently insert any KNOWN_FLAGS rows that don't exist yet. */
export async function ensureKnownFlags(): Promise<void> {
  const existing = await db.select({ key: featureFlags.key }).from(featureFlags);
  const have = new Set(existing.map((r) => r.key));
  const missing = Object.entries(KNOWN_FLAGS).filter(([key]) => !have.has(key));
  if (missing.length === 0) return;
  await db.insert(featureFlags).values(
    missing.map(([key, description]) => ({
      key,
      description,
      enabled:
        key === "ai.assistant" || key === "billing.usage_overage" || key === "admin.impersonation",
    })),
  );
}
