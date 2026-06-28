import { eq } from "drizzle-orm";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { byoKeys } from "@/lib/db/schema";
import { scopedLogger } from "@/lib/observability/logger";
import type { ByoKey } from "./providers";

const log = scopedLogger("ai:byo");

/** The org's active bring-your-own provider key, decrypted, or null. */
export async function getActiveByoKey(organizationId: string): Promise<ByoKey | null> {
  const [row] = await db
    .select()
    .from(byoKeys)
    .where(eq(byoKeys.organizationId, organizationId))
    .limit(1);
  if (!row) return null;
  try {
    return { provider: row.provider, key: decryptSecret(row.encryptedKey) };
  } catch (err) {
    log.error({ err, organizationId }, "failed to decrypt BYO key");
    return null;
  }
}
