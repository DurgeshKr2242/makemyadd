import { expect, test } from "@playwright/test";

const live = !!process.env.E2E_LIVE_DB;

/**
 * Live-DB happy path. Skipped by default — set `E2E_LIVE_DB=1` to opt in.
 *
 * Pre-requisites for the run:
 *   - dev server is up (Playwright config will boot one)
 *   - .env.local has Supabase URL + anon key for the linked dev project
 *   - Cloudflare's "always-passes" Turnstile test keys are set:
 *       NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
 *       TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
 *
 * The test creates a fresh user per run with a randomised email; cleanup is
 * left to the dev project (the user is harmless and inert without verification).
 */
test.describe(live ? "Auth flow (live DB)" : "Auth flow", () => {
  test.skip(
    !live,
    "set E2E_LIVE_DB=1 to run this against the linked Supabase project",
  );

  const stamp = Date.now();
  const email = `e2e-${stamp}@adcreator-e2e.invalid`;
  const password = "Strong1!aa";

  test("signup → dashboard → sign out → sign in → protected redirect", async ({
    page,
  }) => {
    // ─── SIGN UP ─────────────────────────────────────────────────────────────
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("E2E Test");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    // Wait for the captcha widget to auto-resolve (test site key always passes)
    await expect(
      page.getByRole("button", { name: /Create account/ }),
    ).toBeEnabled({ timeout: 15_000 });
    await page.getByRole("button", { name: /Create account/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    // ─── SIGN OUT ────────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Account|E2E/ }).click();
    await page.getByRole("menuitem", { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });

    // ─── SIGN IN ─────────────────────────────────────────────────────────────
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /Sign in/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    // ─── PROTECTED ROUTE GUARD ───────────────────────────────────────────────
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });
});
