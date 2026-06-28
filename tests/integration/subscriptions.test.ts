import { nanoid } from "nanoid";
import { describe, expect, it } from "vitest";
import { PLANS } from "@/lib/billing/plans";
import { getBillingSummary, setPlan } from "@/lib/billing/subscriptions";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function makeOrg() {
  const id = nanoid();
  await db.insert(organizations).values({ id, name: "Test", slug: `t-${id}` });
  return id;
}

describe("subscriptions", () => {
  it("upgrading a plan resets credits to the plan's included amount", async () => {
    const org = await makeOrg();
    await setPlan({ organizationId: org, plan: "pro", resetCredits: true });

    const summary = await getBillingSummary(org);
    expect(summary.plan).toBe("pro");
    expect(summary.status).toBe("active");
    expect(summary.includedMonthly).toBe(PLANS.pro.includedCredits);
    expect(summary.balance).toBe(PLANS.pro.includedCredits);
  });

  it("canceling moves the org back to the free plan", async () => {
    const org = await makeOrg();
    await setPlan({ organizationId: org, plan: "scale", resetCredits: true });
    await setPlan({ organizationId: org, plan: "free", status: "canceled" });

    const summary = await getBillingSummary(org);
    expect(summary.plan).toBe("free");
    expect(summary.status).toBe("canceled");
  });
});
