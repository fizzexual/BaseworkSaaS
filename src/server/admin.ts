import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/env";

/** The session if the caller is a super-admin (global role "admin" or a
 * configured SUPER_ADMIN_EMAILS address), otherwise null. */
export async function getSuperAdmin() {
  const session = await getSession();
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  const ok = role === "admin" || isSuperAdmin(session.user.email);
  return ok ? session : null;
}

export async function requireSuperAdmin() {
  const session = await getSuperAdmin();
  if (!session) throw new Error("FORBIDDEN");
  return session;
}
