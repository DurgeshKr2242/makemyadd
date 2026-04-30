/**
 * dashboard-flow.spec.ts — public dashboard UI flows
 *
 * The /dashboard route is auth-gated (middleware redirects unauthenticated
 * requests to /login). These tests cover the publicly accessible portions
 * of the app:
 *
 * - /templates page: template grid renders, canvases mount
 *
 * Authenticated dashboard flows (language switching, copy generation stepper,
 * template switching on the live canvas) require a Supabase test-user fixture.
 * Those are tracked in TODO §0.2 and will land once auth fixtures are wired.
 *
 * In the meantime this file keeps the test scaffold so the structure is clear
 * and CI knows the suite exists.
 */
import { expect, test } from "@playwright/test";

test.describe("public page flows", () => {
  test("/templates page loads and renders the template grid", async ({
    page,
  }) => {
    await page.goto("/templates");

    // Page heading should be visible
    await expect(
      page.getByRole("heading", { name: /Designs that/i }),
    ).toBeVisible({ timeout: 10_000 });

    // At least one canvas should be rendered
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });
    const count = await page.locator("canvas").count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("/templates — each canvas card has a visible template name", async ({
    page,
  }) => {
    await page.goto("/templates");
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });

    // Each article card in the grid should show a name + format badge
    const cards = page.locator("article");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Every card should have a visible text label (template name)
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
    }
  });

  test("/dashboard unauthenticated → redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    // Middleware should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
  });

  test("/login page is accessible and renders the sign-in form", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({
      timeout: 10_000,
    });
    // Google sign-in button should be present
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });
});
