import { and, eq } from "drizzle-orm";
import { MembersManager } from "@/components/dashboard/members-manager";
import { db } from "@/lib/db";
import { invitations, members, users } from "@/lib/db/schema";
import { can } from "@/lib/rbac";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Members" };

export default async function MembersPage() {
  const ctx = await requireActiveOrg();

  const rows = await db
    .select({
      id: members.id,
      role: members.role,
      userId: members.userId,
      name: users.name,
      email: users.email,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.organizationId, ctx.activeOrg.id));

  const invites = await db
    .select()
    .from(invitations)
    .where(
      and(eq(invitations.organizationId, ctx.activeOrg.id), eq(invitations.status, "pending")),
    );

  const memberList = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    isSelf: r.userId === ctx.user.id,
  }));
  const inviteList = invites.map((i) => ({ id: i.id, email: i.email, role: i.role }));

  return (
    <MembersManager
      members={memberList}
      invitations={inviteList}
      canManage={can(ctx.role, "members:invite")}
      canRemove={can(ctx.role, "members:remove")}
    />
  );
}
