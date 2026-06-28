import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      // In-memory embedded Postgres — no external services needed in CI.
      PGLITE_PATH: "memory://",
    },
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
