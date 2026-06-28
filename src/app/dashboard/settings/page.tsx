import { eq } from "drizzle-orm";
import { SettingsForms } from "@/components/dashboard/settings-forms";
import { db } from "@/lib/db";
import { byoKeys } from "@/lib/db/schema";
import { can } from "@/lib/rbac";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireActiveOrg();
  const [key] = await db
    .select()
    .from(byoKeys)
    .where(eq(byoKeys.organizationId, ctx.activeOrg.id))
    .limit(1);

  return (
    <SettingsForms
      orgName={ctx.activeOrg.name}
      byoKey={key ? { provider: key.provider, last4: key.last4 } : null}
      canManageOrg={can(ctx.role, "org:update")}
      canManageKeys={can(ctx.role, "apikeys:manage")}
    />
  );
}
