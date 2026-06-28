"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { grantCredits } from "@/lib/billing/credits";
import { ensureKnownFlags, setFlag } from "@/lib/flags";
import { MODULES, type ModuleKey } from "@/lib/modules";
import { type NavLayout, type ThemePref, updatePlatformSettings } from "@/lib/settings";
import { requireSuperAdmin } from "@/server/admin";

export async function adminToggleFlag(key: string, enabled: boolean) {
  const session = await requireSuperAdmin();
  await setFlag(key, enabled);
  await audit({
    actorId: session.user.id,
    actorType: "admin",
    action: "flag.toggle",
    targetType: "flag",
    targetId: key,
    meta: { enabled },
  });
  revalidatePath("/admin/flags");
}

export async function adminGrantCredits(organizationId: string, credits: number) {
  const session = await requireSuperAdmin();
  if (!Number.isFinite(credits) || credits <= 0) throw new Error("Invalid credit amount");
  await grantCredits({ organizationId, credits, type: "grant" });
  await audit({
    organizationId,
    actorId: session.user.id,
    actorType: "admin",
    action: "credits.grant",
    targetType: "organization",
    targetId: organizationId,
    meta: { credits },
  });
  revalidatePath("/admin");
}

/* ───────────────────────────── Platform settings ───────────────────────────── */

const THEMES: ThemePref[] = ["light", "dark", "system"];

export async function adminUpdateAppearance(input: {
  navLayout: string;
  defaultTheme: string;
  brandName: string;
  brandColor: string;
}) {
  const session = await requireSuperAdmin();
  const navLayout: NavLayout = input.navLayout === "topnav" ? "topnav" : "sidebar";
  const defaultTheme: ThemePref = THEMES.includes(input.defaultTheme as ThemePref)
    ? (input.defaultTheme as ThemePref)
    : "light";
  const brandName = input.brandName.trim().slice(0, 40) || null;
  const trimmedColor = input.brandColor.trim().toLowerCase();
  const brandColor = /^#[0-9a-f]{6}$/.test(trimmedColor) ? trimmedColor : null;

  await updatePlatformSettings({ navLayout, defaultTheme, brandName, brandColor });
  await audit({
    actorId: session.user.id,
    actorType: "admin",
    action: "settings.appearance",
    meta: { navLayout, defaultTheme, brandName, brandColor },
  });
  revalidatePath("/", "layout");
}

export async function adminUpdateAccess(input: {
  signupsOpen: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}) {
  const session = await requireSuperAdmin();
  const maintenanceMessage = input.maintenanceMessage.trim().slice(0, 200) || null;
  const signupsOpen = Boolean(input.signupsOpen);
  const maintenanceMode = Boolean(input.maintenanceMode);

  await updatePlatformSettings({ signupsOpen, maintenanceMode, maintenanceMessage });
  await audit({
    actorId: session.user.id,
    actorType: "admin",
    action: "settings.access",
    meta: { signupsOpen, maintenanceMode },
  });
  revalidatePath("/", "layout");
}

export async function adminToggleModule(module: ModuleKey, enabled: boolean) {
  const session = await requireSuperAdmin();
  if (!MODULES.includes(module)) throw new Error("Unknown module");
  await ensureKnownFlags();
  await setFlag(`modules.${module}`, enabled);
  await audit({
    actorId: session.user.id,
    actorType: "admin",
    action: "settings.module",
    targetType: "module",
    targetId: module,
    meta: { enabled },
  });
  revalidatePath("/", "layout");
}
