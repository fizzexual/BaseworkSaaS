import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { organizations, usageEvents } from "@/lib/db/schema";

describe("multi-tenant isolation", () => {
  it("org-scoped queries never leak across organizations", async () => {
    const a = nanoid();
    const b = nanoid();
    await db.insert(organizations).values([
      { id: a, name: "Org A", slug: `a-${a}` },
      { id: b, name: "Org B", slug: `b-${b}` },
    ]);
    await db.insert(usageEvents).values([
      { id: nanoid(), organizationId: a, type: "ai.chat", credits: -5 },
      { id: nanoid(), organizationId: a, type: "ai.chat", credits: -3 },
      { id: nanoid(), organizationId: b, type: "ai.chat", credits: -9 },
    ]);

    const aRows = await db.select().from(usageEvents).where(eq(usageEvents.organizationId, a));
    expect(aRows).toHaveLength(2);
    expect(aRows.every((r) => r.organizationId === a)).toBe(true);

    const bRows = await db.select().from(usageEvents).where(eq(usageEvents.organizationId, b));
    expect(bRows).toHaveLength(1);
    expect(bRows[0]?.credits).toBe(-9);
  });
});
