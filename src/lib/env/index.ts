import { z } from "zod";

/**
 * Environment + runtime-mode resolution.
 *
 * Basework is designed to boot with **zero configuration**: when a service's
 * credentials are absent, we transparently fall back to an embedded or mock
 * implementation. This module is the single source of truth for "which mode
 * are we in" and is consumed by the db, billing, ai, email, and rate-limit
 * layers.
 *
 * We intentionally DO NOT throw at import time when production secrets are
 * missing — that would break `next build` in CI. Misconfiguration is surfaced
 * at runtime and by the `pnpm doctor` script instead.
 */

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),

  BETTER_AUTH_SECRET: optionalString,
  BETTER_AUTH_URL: optionalString,

  DATABASE_URL: optionalString,

  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,

  OPENAI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  AI_DEFAULT_MODEL: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default("Basework <onboarding@resend.dev>"),

  UPSTASH_REDIS_REST_URL: optionalString,
  UPSTASH_REDIS_REST_TOKEN: optionalString,

  SUPER_ADMIN_EMAILS: z.string().default("admin@basework.dev"),

  ENCRYPTION_KEY: optionalString,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Shouldn't happen given the lenient schema, but fail loudly if it does.
  console.error("❌ Invalid environment configuration:", parsed.error.issues);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/**
 * A stable, well-known development secret. Used ONLY when no real
 * BETTER_AUTH_SECRET is provided and we're not in production. Never relied on
 * for anything that leaves the developer's machine.
 */
const DEV_AUTH_SECRET = "basework-dev-secret-do-not-use-in-production-0000000000";

export const authSecret = env.BETTER_AUTH_SECRET ?? (isProduction ? "" : DEV_AUTH_SECRET);
export const authBaseUrl = env.BETTER_AUTH_URL ?? env.APP_URL;

/** Encryption key for BYO provider keys; dev fallback derived from auth secret. */
export const encryptionKey = env.ENCRYPTION_KEY ?? (isProduction ? "" : `${DEV_AUTH_SECRET}::enc`);

export type DbMode = "postgres" | "pglite";
export type BillingMode = "stripe" | "mock";
export type AiMode = "live" | "mock";
export type EmailMode = "resend" | "console";
export type RateLimitMode = "upstash" | "memory";

export const dbMode: DbMode = env.DATABASE_URL ? "postgres" : "pglite";
export const billingMode: BillingMode = env.STRIPE_SECRET_KEY ? "stripe" : "mock";
export const aiMode: AiMode = env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY ? "live" : "mock";
export const emailMode: EmailMode = env.RESEND_API_KEY ? "resend" : "console";
export const rateLimitMode: RateLimitMode =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? "upstash" : "memory";

export const superAdminEmails = env.SUPER_ADMIN_EMAILS.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdmin(email: string | null | undefined) {
  return !!email && superAdminEmails.includes(email.toLowerCase());
}

/** True when the app is running entirely on embedded/mock services. */
export const isDemoMode = dbMode === "pglite" && billingMode === "mock" && aiMode === "mock";

/** A summary used by the dashboard "Demo mode" banner and the doctor script. */
export const runtimeModes = {
  db: dbMode,
  billing: billingMode,
  ai: aiMode,
  email: emailMode,
  rateLimit: rateLimitMode,
  demo: isDemoMode,
} as const;

/** Public, client-safe subset of configuration. */
export const publicConfig = {
  appUrl: env.APP_URL,
  stripePublishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
  billingMode,
  aiMode,
  demo: isDemoMode,
} as const;
