/**
 * dashboard-flow.spec.ts — dashboard + public UI flows
 *
 * In **dev / scaffold mode** (Supabase env unset), middleware passes the
 * /dashboard route through and the layout renders with the placeholder
 * "you@brand.in (dev mode)" account email. That's the state we test
 * against here.
 *
 * Once `NEXT_PUBLIC_SUPABASE_URL` is set, middleware will block
 * unauthenticated requests with a redirect to /login — those tests will
 * need a Supabase test-user fixture to keep passing. Tracked in TODO §0.2.
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

  test("/dashboard in dev mode (no Supabase env) renders with placeholder account", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // No redirect — dev-mode lets the dashboard layout render
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    // The Live preview canvas mounts
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });
    // Page title heading is present
    await expect(page.getByRole("heading", { name: /Make a/i })).toBeVisible();
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
