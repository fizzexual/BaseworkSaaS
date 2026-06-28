import { desc, eq, sql } from "drizzle-orm";
import { Building2, CreditCard, Users } from "lucide-react";
import { OrgsTable } from "@/components/admin/orgs-table";
import { UsersTable } from "@/components/admin/users-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { db } from "@/lib/db";
import { creditBalances, organizations, users } from "@/lib/db/schema";

async function count(table: typeof users | typeof organizations) {
  const [row] = await db.select({ c: sql<number>`count(*)` }).from(table);
  return Number(row?.c ?? 0);
}

export default async function AdminOverviewPage() {
  const [userRows, orgRows, userCount, orgCount] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50),
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        plan: organizations.plan,
        balance: creditBalances.balance,
      })
      .from(organizations)
      .leftJoin(creditBalances, eq(creditBalances.organizationId, organizations.id))
      .orderBy(desc(organizations.createdAt))
      .limit(50),
    count(users),
    count(organizations),
  ]);

  const paidOrgs = orgRows.filter((o) => o.plan !== "free").length;
  const orgs = orgRows.map((o) => ({ ...o, balance: o.balance ?? 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Super-admin tools — impersonate users, grant credits, toggle flags.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Users" value={userCount} icon={Users} />
        <StatCard label="Organizations" value={orgCount} icon={Building2} />
        <StatCard label="Paid orgs" value={paidOrgs} icon={CreditCard} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UsersTable users={userRows} />
        <OrgsTable orgs={orgs} />
      </div>
    </div>
  );
}
