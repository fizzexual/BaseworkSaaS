"use client";

import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client. baseURL defaults to the current origin, so no public
 * env var is required. Mirrors the server plugins (organization + admin).
 */
export const authClient = createAuthClient({
  plugins: [organizationClient(), adminClient()],
});

export const { signIn, signUp, signOut, useSession, organization, admin, useListOrganizations } =
  authClient;
