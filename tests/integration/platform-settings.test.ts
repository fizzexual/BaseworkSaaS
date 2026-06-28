import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { getModuleStates, isModuleEnabled, setFlag } from "@/lib/flags";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/settings";
import { assertModuleEnabled, assertWritable, isMaintenanceLocked } from "@/server/guards";

describe("platform settings", () => {
  it("returns code defaults when no settings row exists", async () => {
    const s = await getPlatformSettings();
    expect(s.navLayout).toBe("sidebar");
    expect(s.defaultTheme).toBe("light");
    expect(s.signupsOpen).toBe(true);
    expect(s.maintenanceMode).toBe(false);
    expect(s.brandName).toBeNull();
    expect(s.brandColor).toBeNull();
  });

  it("upserts a patch and merges subsequent patches", async () => {
    await updatePlatformSettings({ navLayout: "topnav", brandName: "Acme", maintenanceMode: true });
    const [row1] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"));
    expect(row1?.navLayout).toBe("topnav");
    expect(row1?.brandName).toBe("Acme");
    expect(row1?.maintenanceMode).toBe(true);
    expect(row1?.signupsOpen).toBe(true); // default preserved on insert

    await updatePlatformSettings({ signupsOpen: false });
    const [row2] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"));
    expect(row2?.signupsOpen).toBe(false);
    expect(row2?.navLayout).toBe("topnav"); // earlier patch untouched
  });
});

describe("feature modules", () => {
  it("are enabled by default (a missing flag counts as on)", async () => {
    expect(await isModuleEnabled("billing")).toBe(true);
    expect(await getModuleStates()).toEqual({
      ai: true,
      billing: true,
      members: true,
      usage: true,
    });
  });

  it("reflect a disabled module flag", async () => {
    await setFlag("modules.usage", false);
    expect(await isModuleEnabled("usage")).toBe(false);
    const states = await getModuleStates();
    expect(states.usage).toBe(false);
    expect(states.ai).toBe(true);
  });
});

describe("server guards (enforcement boundary)", () => {
  const admin = { email: "admin@basework.dev", role: "admin" };
  const member = { email: "member@acme.test", role: "user" };

  it("assertModuleEnabled passes when on and throws when off", async () => {
    await getModuleStates(); // ensure flag rows exist
    await setFlag("modules.billing", true);
    await expect(assertModuleEnabled("billing")).resolves.toBeUndefined();
    await setFlag("modules.billing", false);
    await expect(assertModuleEnabled("billing")).rejects.toThrow();
  });

  it("maintenance lock applies to non-admins only", async () => {
    await updatePlatformSettings({ maintenanceMode: false });
    expect(await isMaintenanceLocked(member)).toBe(false);

    await updatePlatformSettings({ maintenanceMode: true });
    expect(await isMaintenanceLocked(member)).toBe(true);
    expect(await isMaintenanceLocked(admin)).toBe(false); // super-admin exempt

    await expect(assertWritable(member)).rejects.toThrow();
    await expect(assertWritable(admin)).resolves.toBeUndefined();
  });
});
