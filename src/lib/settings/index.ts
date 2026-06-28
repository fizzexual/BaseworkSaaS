import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";
import { NAV_LAYOUT } from "@/lib/constants";
import { db } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/init";
import { platformSettings } from "@/lib/db/schema";

/**
 * Platform settings — the global, runtime configuration a super-admin controls
 * from /admin/settings. Stored as a singleton row (id = "default"); when the row
 * is absent we fall back to code defaults (seeded from build-time env where
 * relevant), so the app boots with zero configuration.
 */

export type NavLayout = "sidebar" | "topnav";
export type ThemePref = "light" | "dark" | "system";

export interface PlatformSettings {
  navLayout: NavLayout;
  defaultTheme: ThemePref;
  brandName: string | null;
  brandColor: string | null;
  signupsOpen: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

const SINGLETON_ID = "default";

/** Defaults used when no settings row exists yet. Nav layout seeds from env. */
export const PLATFORM_DEFAULTS: PlatformSettings = {
  navLayout: NAV_LAYOUT,
  defaultTheme: "light",
  brandName: null,
  brandColor: null,
  signupsOpen: true,
  maintenanceMode: false,
  maintenanceMessage: null,
};

/**
 * Read the platform settings (request-cached). Resilient: any failure (e.g. the
 * table not migrated yet) returns defaults rather than crashing the root layout.
 */
export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  try {
    await ensureDatabaseReady();
    const [row] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, SINGLETON_ID))
      .limit(1);
    if (!row) return PLATFORM_DEFAULTS;
    return {
      navLayout: row.navLayout,
      defaultTheme: row.defaultTheme,
      brandName: row.brandName ?? null,
      brandColor: row.brandColor ?? null,
      signupsOpen: row.signupsOpen,
      maintenanceMode: row.maintenanceMode,
      maintenanceMessage: row.maintenanceMessage ?? null,
    };
  } catch {
    return PLATFORM_DEFAULTS;
  }
});

/** Upsert a partial patch onto the singleton settings row. */
export async function updatePlatformSettings(patch: Partial<PlatformSettings>): Promise<void> {
  await ensureDatabaseReady();
  await db
    .insert(platformSettings)
    .values({ id: SINGLETON_ID, ...PLATFORM_DEFAULTS, ...patch })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: { ...patch, updatedAt: new Date() },
    });
}
