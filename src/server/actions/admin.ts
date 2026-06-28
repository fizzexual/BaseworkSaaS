"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { grantCredits } from "@/lib/billing/credits";
import { setFlag } from "@/lib/flags";
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
