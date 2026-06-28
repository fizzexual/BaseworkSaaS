import "server-only";

import { isSuperAdmin } from "@/lib/env";
import { isModuleEnabled } from "@/lib/flags";
import type { ModuleKey } from "@/lib/modules";
import { getPlatformSettings } from "@/lib/settings";

/**
 * Server-side enforcement of platform settings at mutation boundaries — so the
 * super-admin's module + maintenance switches are real access controls, not just
 * UI/route-page gates. Pair these with the page guards (which redirect) on the
 * data paths a disabled module or a maintenance freeze must actually stop.
 */

type GuardUser = { email: string; role?: string | null };

const isAdmin = (u: GuardUser) => u.role === "admin" || isSuperAdmin(u.email);

/** True when maintenance mode is on and the caller is not a super-admin. */
export async function isMaintenanceLocked(user: GuardUser): Promise<boolean> {
  const { maintenanceMode } = await getPlatformSettings();
  return maintenanceMode && !isAdmin(user);
}

/** Throw if the app is frozen for this user (maintenance mode, non-admin). */
export async function assertWritable(user: GuardUser): Promise<void> {
  if (await isMaintenanceLocked(user)) {
    throw new Error("The app is in maintenance mode. Please try again shortly.");
  }
}

/** Throw if a super-admin has switched this feature module off. */
export async function assertModuleEnabled(module: ModuleKey): Promise<void> {
  if (!(await isModuleEnabled(module))) {
    throw new Error("This feature is currently disabled.");
  }
}
