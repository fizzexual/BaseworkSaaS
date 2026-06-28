import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { APP_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendInvitationEmail } from "@/lib/email";
import { authBaseUrl, authSecret, env, superAdminEmails } from "@/lib/env";

/**
 * Better Auth instance — the single source of truth for authentication.
 *
 * Plugins:
 *  - organization: multi-tenant orgs, members, roles, invitations
 *  - admin: super-admin user management + secure impersonation
 *  - nextCookies: cookie handling for Next.js server actions
 *
 * Social providers are enabled only when their credentials are present, so the
 * zero-config dev experience uses email + password out of the box.
 */
export const auth = betterAuth({
  appName: APP_NAME,
  secret: authSecret,
  baseURL: authBaseUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  databaseHooks: {
    user: {
      create: {
        // Auto-grant the global admin role to configured super-admin emails.
        before: async (user) => {
          const role = superAdminEmails.includes(user.email.toLowerCase()) ? "admin" : "user";
          return { data: { ...user, role } };
        },
      },
    },
  },
  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        await sendInvitationEmail({
          to: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          inviteUrl: `${env.APP_URL}/accept-invitation/${data.id}`,
        });
      },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
