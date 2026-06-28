import { describe, expect, it } from "vitest";
import { assertPermission, can, ForbiddenError, permissionsFor } from "@/lib/rbac";

describe("rbac", () => {
  it("owner has every permission", () => {
    expect(can("owner", "org:delete")).toBe(true);
    expect(can("owner", "billing:manage")).toBe(true);
  });

  it("admin can manage members but not delete the org", () => {
    expect(can("admin", "members:invite")).toBe(true);
    expect(can("admin", "billing:manage")).toBe(true);
    expect(can("admin", "org:delete")).toBe(false);
  });

  it("member has only read + ai:use", () => {
    expect(can("member", "ai:use")).toBe(true);
    expect(can("member", "members:read")).toBe(true);
    expect(can("member", "members:invite")).toBe(false);
    expect(can("member", "billing:manage")).toBe(false);
  });

  it("assertPermission throws ForbiddenError when denied", () => {
    expect(() => assertPermission("member", "billing:manage")).toThrow(ForbiddenError);
    expect(() => assertPermission("owner", "billing:manage")).not.toThrow();
  });

  it("permissionsFor returns a non-empty set per role", () => {
    expect(permissionsFor("owner").length).toBeGreaterThan(permissionsFor("member").length);
  });
});
