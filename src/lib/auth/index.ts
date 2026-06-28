import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { and, eq, gt } from "drizzle-orm";
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
        before: async (user) => {
          // Invite-only mode: when a super-admin has closed sign-ups, only emails
          // with a pending invitation may create an account.
          const [settings] = await db
            .select({ signupsOpen: schema.platformSettings.signupsOpen })
            .from(schema.platformSettings)
            .limit(1);
          if (settings && !settings.signupsOpen) {
            const [invite] = await db
              .select({ id: schema.invitations.id })
              .from(schema.invitations)
              .where(
                and(
                  eq(schema.invitations.email, user.email),
                  eq(schema.invitations.status, "pending"),
                  gt(schema.invitations.expiresAt, new Date()),
                ),
              )
              .limit(1);
            if (!invite) {
              throw new APIError("FORBIDDEN", {
                message: "Sign-ups are closed. You need an invitation to join.",
              });
            }
          }
          // Auto-grant the global admin role to configured super-admin emails.
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
