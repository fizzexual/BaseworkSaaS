import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

/**
 * Captures product screenshots for the README against a running dev server.
 * Usage: pnpm dev (in one terminal), then `pnpm exec tsx scripts/screenshots.ts`.
 */
const BASE = process.env.SHOT_BASE ?? "http://localhost:3100";
const OUT = path.join(process.cwd(), "docs", "screenshots");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();

  async function shot(name: string, fullPage = false) {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
    console.log("✓", name);
  }

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shot("landing", true);

  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await shot("pricing", true);

  await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("admin@basework.dev");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await page.waitForTimeout(900);
  await shot("dashboard");

  await page.goto(`${BASE}/dashboard/ai`);
  const input = page.getByPlaceholder(/ask anything/i);
  await input.fill("What can Basework do?");
  await input.press("Enter");
  await page.getByText(/mock AI provider/i).waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await shot("ai-chat");

  await page.goto(`${BASE}/dashboard/billing`);
  await page.waitForTimeout(600);
  await shot("billing");

  await page.goto(`${BASE}/dashboard/usage`);
  await page.waitForTimeout(600);
  await shot("usage");

  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(600);
  await shot("admin");

  await browser.close();
  console.log("\nScreenshots written to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
