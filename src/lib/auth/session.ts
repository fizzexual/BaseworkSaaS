import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./index";

/**
 * Resolve the current session from request cookies. Memoized per-request with
 * React `cache` so multiple server components share a single lookup.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** Like getSession, but throws if there is no authenticated user. */
export async function requireSession() {
  const session = await getSession();
  if (!session?.user) throw new UnauthorizedError();
  return session;
}
