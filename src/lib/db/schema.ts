import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Basework database schema (Drizzle, Postgres dialect).
 *
 * Conventions:
 *  - Object keys are camelCase to match Better Auth's expected field names;
 *    SQL column names are snake_case.
 *  - Text ids everywhere (nanoid) to interoperate with Better Auth.
 *  - Status-like columns are `text().$type<Union>()` to avoid enum migrations.
 *
 * Sections: Auth · Organizations · Billing · Credits & Usage · AI · Audit ·
 * Feature flags · Jobs.
 */

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

/* ───────────────────────────── Auth (Better Auth core) ───────────────────────────── */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Better Auth admin plugin fields (global role + ban controls):
  role: text("role").$type<"user" | "admin">().notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Set by the Better Auth organization plugin — the user's active org.
    activeOrganizationId: text("active_organization_id"),
    // Set by the admin plugin while a super-admin impersonates a user.
    impersonatedBy: text("impersonated_by"),
    createdAt,
    updatedAt,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt,
    updatedAt,
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* ───────────────────────────── Organizations (multi-tenant) ───────────────────────────── */

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  // Better Auth stores org metadata as a JSON string.
  metadata: text("metadata"),
  // Basework extensions (nullable so Better Auth inserts don't need them):
  plan: text("plan").$type<PlanId>().notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt,
});

export const members = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<OrgRole>().notNull().default("member"),
    createdAt,
  },
  (t) => [
    uniqueIndex("members_org_user_idx").on(t.organizationId, t.userId),
    index("members_user_idx").on(t.userId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<OrgRole>().notNull().default("member"),
    status: text("status")
      .$type<"pending" | "accepted" | "canceled" | "rejected">()
      .notNull()
      .default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("invitations_org_idx").on(t.organizationId)],
);

/* ───────────────────────────── Billing ───────────────────────────── */

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plan: text("plan").$type<PlanId>().notNull().default("free"),
    status: text("status")
      .$type<"trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused">()
      .notNull()
      .default("active"),
    seats: integer("seats").notNull().default(1),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("subscriptions_org_idx").on(t.organizationId),
    index("subscriptions_stripe_sub_idx").on(t.stripeSubscriptionId),
  ],
);

/* ───────────────────────────── Credits & Usage (AI metering) ───────────────────────────── */

export const creditBalances = pgTable("credit_balances", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // Remaining credits available to spend this period (included + topped-up).
  balance: integer("balance").notNull().default(0),
  // Credits included by the current plan each period (for display + reset).
  includedMonthly: integer("included_monthly").notNull().default(0),
  // How many credits over the included amount were consumed (billed as overage).
  overage: integer("overage").notNull().default(0),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull().defaultNow(),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  updatedAt,
});

/**
 * Append-only event log that doubles as the credit ledger.
 * `credits` is signed: negative = consumed, positive = granted/refunded.
 */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").$type<"ai.chat" | "grant" | "adjustment" | "overage">().notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    credits: integer("credits").notNull().default(0),
    balanceAfter: integer("balance_after"),
    threadId: text("thread_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt,
  },
  (t) => [
    index("usage_events_org_idx").on(t.organizationId),
    index("usage_events_created_idx").on(t.createdAt),
  ],
);

/* ───────────────────────────── AI ───────────────────────────── */

export const aiThreads = pgTable(
  "ai_threads",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt,
    updatedAt,
  },
  (t) => [index("ai_threads_org_idx").on(t.organizationId)],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => aiThreads.id, { onDelete: "cascade" }),
    role: text("role").$type<"system" | "user" | "assistant">().notNull(),
    content: text("content").notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    createdAt,
  },
  (t) => [index("ai_messages_thread_idx").on(t.threadId)],
);

/** Bring-your-own provider keys, encrypted at rest. Bypasses credit metering. */
export const byoKeys = pgTable(
  "byo_keys",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").$type<"openai" | "anthropic">().notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    last4: text("last4").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [uniqueIndex("byo_keys_org_provider_idx").on(t.organizationId, t.provider)],
);

/* ───────────────────────────── Audit log ───────────────────────────── */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    actorId: text("actor_id"),
    actorType: text("actor_type").$type<"user" | "admin" | "system">().notNull().default("user"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt,
  },
  (t) => [
    index("audit_logs_org_idx").on(t.organizationId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

/* ───────────────────────────── Feature flags ───────────────────────────── */

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  description: text("description").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(0),
  createdAt,
  updatedAt,
});

export const featureFlagOverrides = pgTable(
  "feature_flag_overrides",
  {
    id: text("id").primaryKey(),
    flagKey: text("flag_key")
      .notNull()
      .references(() => featureFlags.key, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull(),
    createdAt,
  },
  (t) => [uniqueIndex("flag_overrides_idx").on(t.flagKey, t.organizationId)],
);

/* ───────────────────────────── Platform settings (global, superadmin) ───────────────────────────── */

/**
 * Singleton row (id = "default") holding platform-wide configuration the
 * super-admin controls at runtime from /admin/settings: dashboard appearance
 * and access policy. Feature-module on/off lives in `featureFlags` (keys
 * `modules.*`). Absent row ⇒ code defaults (see lib/settings).
 */
export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey(),
  navLayout: text("nav_layout").$type<"sidebar" | "topnav">().notNull().default("sidebar"),
  defaultTheme: text("default_theme")
    .$type<"light" | "dark" | "system">()
    .notNull()
    .default("light"),
  brandName: text("brand_name"),
  brandColor: text("brand_color"),
  signupsOpen: boolean("signups_open").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message"),
  updatedAt,
});

/* ───────────────────────────── Jobs (durable queue) ───────────────────────────── */

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status")
      .$type<"pending" | "processing" | "completed" | "failed">()
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    createdAt,
    updatedAt,
  },
  (t) => [index("jobs_poll_idx").on(t.status, t.runAt)],
);

/* ───────────────────────────── Relations ───────────────────────────── */

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(members),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  members: many(members),
  invitations: many(invitations),
  subscription: one(subscriptions),
  creditBalance: one(creditBalances),
}));

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [members.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const aiThreadsRelations = relations(aiThreads, ({ many, one }) => ({
  messages: many(aiMessages),
  organization: one(organizations, {
    fields: [aiThreads.organizationId],
    references: [organizations.id],
  }),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  thread: one(aiThreads, { fields: [aiMessages.threadId], references: [aiThreads.id] }),
}));

/* ───────────────────────────── Shared types ───────────────────────────── */

export type PlanId = "free" | "pro" | "scale";
export type OrgRole = "owner" | "admin" | "member";

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type CreditBalance = typeof creditBalances.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type AiThread = typeof aiThreads.$inferSelect;
export type AiMessage = typeof aiMessages.$inferSelect;
export type ByoKey = typeof byoKeys.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type PlatformSettingsRow = typeof platformSettings.$inferSelect;
export type Job = typeof jobs.$inferSelect;

/** All tables, for the Better Auth Drizzle adapter `schema` mapping. */
export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  organizations,
  members,
  invitations,
  subscriptions,
  creditBalances,
  usageEvents,
  aiThreads,
  aiMessages,
  byoKeys,
  auditLogs,
  featureFlags,
  featureFlagOverrides,
  platformSettings,
  jobs,
};
