import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (embedded Postgres, WASM), node-postgres and pino must not be
  // bundled — they are loaded at runtime on the server only.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "pino", "pino-pretty"],
  typescript: {
    // We run `tsc --noEmit` as a separate CI gate; don't double-check at build.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
