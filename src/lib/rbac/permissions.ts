import type { OrgRole } from "@/lib/db/schema";

/**
 * Fine-grained, org-scoped permissions. Roles are mapped to explicit
 * permission sets here rather than being checked as bare role strings, so
 * adding a capability is a one-line change and every check is testable.
 */
export const PERMISSIONS = [
  "org:update",
  "org:delete",
  "members:read",
  "members:invite",
  "members:update-role",
  "members:remove",
  "billing:read",
  "billing:manage",
  "ai:use",
  "apikeys:manage",
  "settings:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const OWNER: Permission[] = [...PERMISSIONS];

const ADMIN: Permission[] = [
  "org:update",
  "members:read",
  "members:invite",
  "members:update-role",
  "members:remove",
  "billing:read",
  "billing:manage",
  "ai:use",
  "apikeys:manage",
  "settings:manage",
  "audit:read",
];

const MEMBER: Permission[] = ["members:read", "billing:read", "ai:use"];

export const ROLE_PERMISSIONS: Record<OrgRole, ReadonlyArray<Permission>> = {
  owner: OWNER,
  admin: ADMIN,
  member: MEMBER,
};

/** Does `role` grant `permission`? */
export function can(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** All permissions granted to a role (for surfacing capabilities in the UI). */
export function permissionsFor(role: OrgRole): ReadonlyArray<Permission> {
  return ROLE_PERMISSIONS[role] ?? [];
}
