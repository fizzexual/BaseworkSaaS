"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { byoKeys, organizations } from "@/lib/db/schema";
import { assertPermission } from "@/lib/rbac";
import { requireActiveOrg } from "@/server/context";

export async function updateOrganizationName(name: string) {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "org:update");
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name must be at least 2 characters");
  await db
    .update(organizations)
    .set({ name: trimmed })
    .where(eq(organizations.id, ctx.activeOrg.id));
  await audit({
    organizationId: ctx.activeOrg.id,
    actorId: ctx.user.id,
    action: "org.update",
    meta: { name: trimmed },
  });
  revalidatePath("/dashboard/settings");
}

export async function saveByoKey(provider: "openai" | "anthropic", key: string) {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "apikeys:manage");
  if (key.length < 8) throw new Error("That doesn't look like a valid API key");
  const encryptedKey = encryptSecret(key);
  // A single active BYO key per org.
  await db.delete(byoKeys).where(eq(byoKeys.organizationId, ctx.activeOrg.id));
  await db.insert(byoKeys).values({
    id: nanoid(),
    organizationId: ctx.activeOrg.id,
    provider,
    encryptedKey,
    last4: key.slice(-4),
    createdBy: ctx.user.id,
  });
  await audit({
    organizationId: ctx.activeOrg.id,
    actorId: ctx.user.id,
    action: "apikey.save",
    meta: { provider, last4: key.slice(-4) },
  });
  revalidatePath("/dashboard/settings");
}

export async function removeByoKey() {
  const ctx = await requireActiveOrg();
  assertPermission(ctx.role, "apikeys:manage");
  await db.delete(byoKeys).where(eq(byoKeys.organizationId, ctx.activeOrg.id));
  await audit({ organizationId: ctx.activeOrg.id, actorId: ctx.user.id, action: "apikey.remove" });
  revalidatePath("/dashboard/settings");
}
