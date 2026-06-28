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

  // ~90 days of usage history so the dashboard charts (day/week/month) look real.
  const usageRows: (typeof usageEvents.$inferInsert)[] = [];
  for (let day = 0; day < 90; day++) {
    const date = new Date(now.getTime() - day * 86_400_000);
    const count = Math.max(1, 3 + Math.round(2.2 * Math.sin(day / 4)) + (day < 25 ? 1 : 0));
    for (let k = 0; k < count; k++) {
      usageRows.push({
        id: nanoid(),
        organizationId: orgId,
        userId: (day + k) % 3 === 0 ? member.id : owner.id,
        type: "ai.chat" as const,
        model: "mock:basework-1",
        inputTokens: 120 + ((day * 7 + k * 13) % 220),
        outputTokens: 220 + ((day * 11 + k * 17) % 340),
        credits: -(5 + ((day + k) % 9) * 3),
        createdAt: new Date(date.getTime() - k * 3_600_000),
      });
    }
  }

  // The credit balance reflects only the current billing period (last 30 days).
  const periodCutoff = now.getTime() - 30 * 86_400_000;
  const usedThisPeriod = usageRows
    .filter((r) => (r.createdAt as Date).getTime() >= periodCutoff)
    .reduce((sum, r) => sum + Math.abs(r.credits ?? 0), 0);

  await db.insert(creditBalances).values({
    organizationId: orgId,
    balance: Math.max(0, pro.includedCredits - usedThisPeriod),
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
