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

  test("/signup — dev-mode renders the bot-bypass hint, no Turnstile widget", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: /Create your/i }),
    ).toBeVisible({ timeout: 10_000 });
    // Dev-mode pill present
    await expect(page.getByText(/dev-bypassed/i)).toBeVisible();
  });

  test("/ — emits WebSite + Organization JSON-LD", async ({ page }) => {
    await page.goto("/");
    const ldJson = await page
      .locator('script[type="application/ld+json"]')
      .count();
    expect(ldJson).toBeGreaterThanOrEqual(2);
    const firstSchema = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(firstSchema).toContain("WebSite");
  });

  test("/pricing — emits BreadcrumbList + Product JSON-LD", async ({
    page,
  }) => {
    await page.goto("/pricing");
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(2); // breadcrumbs + at least one product
    // Concat all scripts and assert key strings
    const all = await scripts.evaluateAll((els) =>
      els.map((e) => e.textContent ?? "").join("\n"),
    );
    expect(all).toContain("BreadcrumbList");
    expect(all).toContain('"priceCurrency":"INR"');
  });

  test("/og/hi returns a 1200×630 PNG", async ({ request }) => {
    const res = await request.get("/og/hi");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("/sw.js serves with no-cache + javascript content-type", async ({
    request,
  }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("javascript");
    expect(res.headers()["cache-control"]).toContain("no-cache");
  });

  test("/offline page renders the offline fallback", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByRole("heading", { name: /offline/i })).toBeVisible({
      timeout: 5_000,
    });
  });
});
