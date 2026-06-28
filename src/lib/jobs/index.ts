import { and, asc, eq, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { scopedLogger } from "@/lib/observability/logger";

const log = scopedLogger("jobs");

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

const handlers = new Map<string, JobHandler>();

/** Register a handler for a job type (call at module load). */
export function registerJob(type: string, handler: JobHandler): void {
  handlers.set(type, handler);
}

/** Enqueue a durable job (Postgres-backed). */
export async function enqueue(
  type: string,
  payload: Record<string, unknown> = {},
  opts?: { runAt?: Date; maxAttempts?: number },
): Promise<void> {
  await db.insert(jobs).values({
    id: nanoid(),
    type,
    payload,
    runAt: opts?.runAt ?? new Date(),
    maxAttempts: opts?.maxAttempts ?? 5,
  });
}

/**
 * Process up to `limit` due jobs. Call from a cron (e.g. Vercel Cron hitting
 * /api/jobs/tick). Swap this for Inngest/Trigger.dev by re-implementing
 * enqueue + the handler registry.
 */
export async function processPendingJobs(
  limit = 10,
): Promise<{ processed: number; failed: number }> {
  const now = new Date();
  const due = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "pending"), lte(jobs.runAt, now)))
    .orderBy(asc(jobs.runAt))
    .limit(limit);

  let processed = 0;
  let failed = 0;

  for (const job of due) {
    await db
      .update(jobs)
      .set({ status: "processing", lockedAt: now, attempts: job.attempts + 1, updatedAt: now })
      .where(eq(jobs.id, job.id));

    try {
      const handler = handlers.get(job.type);
      if (!handler) throw new Error(`No handler registered for job type "${job.type}"`);
      await handler(job.payload ?? {});
      await db
        .update(jobs)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(jobs.id, job.id));
      processed++;
    } catch (err) {
      const isFinalAttempt = job.attempts + 1 >= job.maxAttempts;
      failed++;
      log.error({ err, jobId: job.id, type: job.type, final: isFinalAttempt }, "job failed");
      await db
        .update(jobs)
        .set({
          status: isFinalAttempt ? "failed" : "pending",
          lastError: String(err),
          lockedAt: null,
          runAt: new Date(Date.now() + 5000),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));
    }
  }

  return { processed, failed };
}
