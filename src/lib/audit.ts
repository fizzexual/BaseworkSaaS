import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { scopedLogger } from "@/lib/observability/logger";

const log = scopedLogger("audit");

export interface AuditEntry {
  organizationId?: string | null;
  actorId?: string | null;
  actorType?: "user" | "admin" | "system";
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

/**
 * Append an entry to the immutable audit log. Audit writes never throw into the
 * caller — a logging failure must not break the action being recorded.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: nanoid(),
      organizationId: entry.organizationId ?? null,
      actorId: entry.actorId ?? null,
      actorType: entry.actorType ?? "user",
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      meta: entry.meta,
      ip: entry.ip,
    });
  } catch (err) {
    log.error({ err, action: entry.action }, "failed to write audit log");
  }
}
