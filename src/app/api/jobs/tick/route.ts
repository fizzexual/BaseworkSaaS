import "@/lib/jobs/handlers";
import { processPendingJobs } from "@/lib/jobs";

/**
 * Drains the job queue. Point a scheduler at this (Vercel Cron, GitHub Actions,
 * etc.). Protected by CRON_SECRET when set; open in zero-config dev.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("key");
    if (provided !== secret) return new Response("Unauthorized", { status: 401 });
  }
  const result = await processPendingJobs();
  return Response.json(result);
}
