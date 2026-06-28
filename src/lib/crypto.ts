import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { encryptionKey } from "@/lib/env";

/**
 * Authenticated symmetric encryption (AES-256-GCM) for secrets at rest —
 * specifically BYO provider keys. The 32-byte key is derived from
 * ENCRYPTION_KEY. Output format: base64(iv).base64(tag).base64(ciphertext).
 */
function derivedKey(): Buffer {
  return createHash("sha256").update(encryptionKey).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB, tagB, dataB] = payload.split(".");
  if (!ivB || !tagB || !dataB) throw new Error("Malformed ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", derivedKey(), Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]);
  return dec.toString("utf8");
}
