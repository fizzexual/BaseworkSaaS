/**
 * Feature-module identifiers and labels. Dependency-free (no DB import) so this
 * can be shared by client components (the admin form, nav) and the server-only
 * flags module alike.
 */

export const MODULES = ["ai", "billing", "members", "usage"] as const;
export type ModuleKey = (typeof MODULES)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  ai: "AI Assistant",
  billing: "Billing",
  members: "Members & teams",
  usage: "Usage & metering",
};

export const moduleFlagKey = (m: ModuleKey) => `modules.${m}` as const;
