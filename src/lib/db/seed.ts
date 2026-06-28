import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { PLANS } from "@/lib/billing/plans";
import { db } from "./index";
import {
  aiMessages,
  aiThreads,
  creditBalances,
  members,
  organizations,
  subscriptions,
  usageEvents,
  users,
} from "./schema";

/**
 * Demo credentials (printed to the console on first boot):
 *   Owner / super-admin:  admin@basework.dev  / password123
 *   Member:               member@basework.dev / password123
 */
const DEMO_PASSWORD = "password123";

async function ensureUser(input: { email: string; name: string }) {
  const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (existing[0]) return existing[0];
  // Sign up through Better Auth so the password is hashed correctly.
  await auth.api.signUpEmail({
    body: { email: input.email, password: DEMO_PASSWORD, name: input.name },
  });
  const [created] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (!created) throw new Error(`Failed to seed demo user ${input.email}`);
  return created;
}

export async function seedDemoData() {
  const owner = await ensureUser({ email: "admin@basework.dev", name: "Ada Admin" });
  const member = await ensureUser({ email: "member@basework.dev", name: "Moe Member" });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const orgId = nanoid();
  const pro = PLANS.pro;

  await db.insert(organizations).values({
    id: orgId,
    name: "Acme Inc",
    slug: "acme",
    plan: "pro",
    createdAt: now,
  });

  await db.insert(members).values([
    { id: nanoid(), organizationId: orgId, userId: owner.id, role: "owner", createdAt: now },
    { id: nanoid(), organizationId: orgId, userId: member.id, role: "member", createdAt: now },
  ]);

  await db.insert(subscriptions).values({
    id: nanoid(),
    organizationId: orgId,
    plan: "pro",
    status: "active",
    seats: 3,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    createdAt: now,
    updatedAt: now,
  });

  // Usage history spread across the period so the dashboard chart is populated.
  const usageRows = Array.from({ length: 26 }).map((_, i) => {
    const dayOffset = Math.floor(i / 2); // ~2 events/day across ~13 days
    return {
      id: nanoid(),
      organizationId: orgId,
      userId: i % 2 ? member.id : owner.id,
      type: "ai.chat" as const,
      model: "mock:basework-1",
      inputTokens: 120 + ((i * 17) % 200),
      outputTokens: 220 + ((i * 29) % 320),
      credits: -(6 + ((i * 7) % 28)),
      createdAt: new Date(now.getTime() - dayOffset * 86_400_000 - (i % 2) * 9_000_000),
    };
  });
  const used = usageRows.reduce((sum, r) => sum + Math.abs(r.credits), 0);

  await db.insert(creditBalances).values({
    organizationId: orgId,
    balance: pro.includedCredits - used,
    includedMonthly: pro.includedCredits,
    overage: 0,
    periodStart: now,
    periodEnd,
    updatedAt: now,
  });

  await db.insert(usageEvents).values(usageRows);

  // A sample AI thread.
  const threadId = nanoid();
  await db.insert(aiThreads).values({
    id: threadId,
    organizationId: orgId,
    userId: owner.id,
    title: "Welcome to Basework",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(aiMessages).values([
    {
      id: nanoid(),
      threadId,
      role: "user",
      content: "What can Basework do?",
      createdAt: now,
    },
    {
      id: nanoid(),
      threadId,
      role: "assistant",
      content:
        "Auth, multi-tenant orgs with fine-grained RBAC, Stripe billing with usage-based credit metering, an admin panel with impersonation, audit logs, a durable job queue — all running zero-config out of the box.",
      model: "mock:basework-1",
      inputTokens: 12,
      outputTokens: 48,
      createdAt: new Date(now.getTime() + 1000),
    },
  ]);
}
