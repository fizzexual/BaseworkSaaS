import { redirect } from "next/navigation";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { isDemoMode, isSuperAdmin } from "@/lib/env";
import { getAuthContext } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in");
  if (!ctx.activeOrg) redirect("/onboarding");

  const memberships = ctx.memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));
  const activeOrg = {
    id: ctx.activeOrg.id,
    name: ctx.activeOrg.name,
    slug: ctx.activeOrg.slug,
    plan: ctx.activeOrg.plan,
  };
  const user = { name: ctx.user.name, email: ctx.user.email, image: ctx.user.image ?? null };
  const superAdmin =
    (ctx.user as { role?: string }).role === "admin" || isSuperAdmin(ctx.user.email);
  const impersonating = Boolean((ctx.session as { impersonatedBy?: string }).impersonatedBy);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={user}
        activeOrg={activeOrg}
        memberships={memberships}
        superAdmin={superAdmin}
      />
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        {impersonating && <ImpersonationBanner userName={user.name} />}
        {isDemoMode && <DemoBanner />}
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
