import { env, rateLimitMode } from "@/lib/env";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
}

const buckets = new Map<string, { count: number; reset: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1, limit, reset: now + windowMs };
  }
  bucket.count++;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    limit,
    reset: bucket.reset,
  };
}

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  try {
    const base = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;
    const redisKey = `rl:${key}`;
    const headers = { Authorization: `Bearer ${token}` };
    const incr = (await fetch(`${base}/incr/${redisKey}`, { headers }).then((r) => r.json())) as {
      result: number;
    };
    const count = incr.result;
    if (count === 1) {
      await fetch(`${base}/pexpire/${redisKey}/${windowMs}`, { headers });
    }
    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
      reset: Date.now() + windowMs,
    };
  } catch {
    // Fail open — never let the limiter take the app down.
    return { success: true, remaining: limit, limit, reset: Date.now() + windowMs };
  }
}

/**
 * Fixed-window rate limit. In-memory by default; uses Upstash Redis when
 * configured (swap in @upstash/ratelimit for sliding-window in production).
 */
export async function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  return rateLimitMode === "upstash"
    ? upstashLimit(key, limit, windowMs)
    : memoryLimit(key, limit, windowMs);
}
