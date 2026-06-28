import { expect, test } from "@playwright/test";

const DEMO = { email: "admin@basework.dev", password: "password123" };

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(DEMO.email);
  await page.getByLabel("Password").fill(DEMO.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

test("landing page renders with a hero and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
});

test("a user can sign in and see their dashboard", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByText("Acme Inc").first()).toBeVisible();
});

test("the AI assistant streams a metered reply", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard/ai");
  const input = page.getByPlaceholder(/ask anything/i);
  await input.fill("Tell me about Basework");
  await input.press("Enter");
  await expect(page.getByText(/mock AI provider/i)).toBeVisible({ timeout: 20_000 });
});

test("billing page lists the plans", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard/billing");
  await expect(page.getByText("Pro", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/customer portal/i)).toBeVisible();
});
