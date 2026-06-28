import pino from "pino";
import { isProduction } from "@/lib/env";

/**
 * Structured logger. JSON to stdout (no transports) so it works identically in
 * dev, Next server, Node scripts, and serverless — no worker-thread surprises.
 * Pipe through `pino-pretty` locally if you want colorized logs:
 *   pnpm dev | pnpm exec pino-pretty
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: { app: "basework" },
  redact: {
    paths: ["*.password", "*.token", "*.apiKey", "*.secret", "req.headers.authorization"],
    censor: "[redacted]",
  },
});

export type Logger = typeof logger;

/** Child logger scoped to a subsystem (e.g. "billing", "ai", "jobs"). */
export function scopedLogger(scope: string) {
  return logger.child({ scope });
}
