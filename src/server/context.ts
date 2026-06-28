import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { members, type Organization, type OrgRole, organizations } from "@/lib/db/schema";

export interface Membership {
  organization: Organization;
  role: OrgRole;
}

type SessionResult = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export interface AuthContext {
  user: SessionResult["user"];
  session: SessionResult["session"];
  memberships: Membership[];
  activeOrg: Organization | null;
  role: OrgRole | null;
}

/**
 * The resolved per-request auth context: the signed-in user plus their
 * memberships and the currently active organization (and the caller's role in
 * it). Memoized per request via React `cache`.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await getSession();
  if (!session?.user) return null;

  const rows = await db
    .select({ organization: organizations, role: members.role })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(eq(members.userId, session.user.id))
    .orderBy(desc(organizations.createdAt));

  const memberships: Membership[] = rows.map((r) => ({
    organization: r.organization,
    role: r.role,
  }));

  const activeId = session.session.activeOrganizationId;
  const active = memberships.find((m) => m.organization.id === activeId) ?? memberships[0] ?? null;

  return {
    user: session.user,
    session: session.session,
    memberships,
    activeOrg: active?.organization ?? null,
    role: active?.role ?? null,
  };
});

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("UNAUTHORIZED");
  return ctx;
}

export interface ActiveOrgContext extends AuthContext {
  activeOrg: Organization;
  role: OrgRole;
}

/** Require an authenticated user *with* an active organization. */
export async function requireActiveOrg(): Promise<ActiveOrgContext> {
  const ctx = await requireAuthContext();
  if (!ctx.activeOrg || !ctx.role) throw new Error("NO_ACTIVE_ORG");
  return ctx as ActiveOrgContext;
}
