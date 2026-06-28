/**
 * Next.js instrumentation hook — runs once when the server process boots.
 * We use it to migrate + seed the embedded dev database so `pnpm dev` is
 * truly zero-config. No-op on the edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDatabaseReady } = await import("@/lib/db/init");
    await ensureDatabaseReady();
  }
}
