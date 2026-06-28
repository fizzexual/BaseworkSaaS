import type { OrgRole } from "@/lib/db/schema";
import { can, type Permission } from "./permissions";

export * from "./permissions";

/** Thrown when an actor lacks a required permission. */
export class ForbiddenError extends Error {
  constructor(public permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** Throw unless `role` grants `permission`. Use at the top of server actions. */
export function assertPermission(role: OrgRole, permission: Permission) {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}
