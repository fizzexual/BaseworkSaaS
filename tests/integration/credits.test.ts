import { nanoid } from "nanoid";
import { describe, expect, it } from "vitest";
import { chargeCredits, creditsForTokens, getBalance, grantCredits } from "@/lib/billing/credits";
import { db } from "@/lib/db";
import { creditBalances, organizations } from "@/lib/db/schema";

async function makeOrg(balance: number, included = balance) {
  const id = nanoid();
  await db.insert(organizations).values({ id, name: "Test", slug: `t-${id}` });
  await db.insert(creditBalances).values({
    organizationId: id,
    balance,
    includedMonthly: included,
    overage: 0,
    periodStart: new Date(),
  });
  return id;
}

describe("credit metering", () => {
  it("creditsForTokens is always at least 1", () => {
    expect(creditsForTokens(0, 0)).toBe(1);
    expect(creditsForTokens(400, 400)).toBe(2);
  });

  it("charges credits and deducts atomically", async () => {
    const org = await makeOrg(100);
    const r = await chargeCredits({ organizationId: org, credits: 30, allowOverage: false });
    expect(r.ok).toBe(true);
    expect(r.balanceAfter).toBe(70);
    expect((await getBalance(org))?.balance).toBe(70);
  });

  it("rejects when insufficient and overage is not allowed (free plan)", async () => {
    const org = await makeOrg(10);
    const r = await chargeCredits({ organizationId: org, credits: 50, allowOverage: false });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("insufficient");
    // balance must be untouched on rejection
    expect((await getBalance(org))?.balance).toBe(10);
  });

  it("allows overage on paid plans and tracks it", async () => {
    const org = await makeOrg(10);
    const r = await chargeCredits({ organizationId: org, credits: 50, allowOverage: true });
    expect(r.ok).toBe(true);
    expect(r.balanceAfter).toBe(0);
    expect(r.overage).toBe(40);
    const bal = await getBalance(org);
    expect(bal?.balance).toBe(0);
    expect(bal?.overage).toBe(40);
  });

  it("grants credits", async () => {
    const org = await makeOrg(0);
    const newBalance = await grantCredits({ organizationId: org, credits: 500 });
    expect(newBalance).toBe(500);
    expect((await getBalance(org))?.balance).toBe(500);
  });
});
