import { expect, test } from "@playwright/test";

const liveR2 = !!process.env.E2E_LIVE_R2;
const liveDb = !!process.env.E2E_LIVE_DB;

test.describe(
  liveR2 && liveDb ? "Extraction flow (live)" : "Extraction flow",
  () => {
    test.skip(
      !(liveR2 && liveDb),
      "set E2E_LIVE_DB=1 and E2E_LIVE_R2=1 to run against the linked services",
    );

    test("URL paste extracts a real product page", async ({ page }) => {
      // Pre-condition: user is signed in. We rely on a test cookie or prior
      // session — adjust with a sign-in step if your e2e harness needs it.
      await page.goto("/dashboard");
      await page.getByRole("tab", { name: /URL/ }).click();
      await page
        .getByPlaceholder("https://example.com/product")
        .fill("https://www.shopify.com/in/blog/successful-shopify-stores");
      await page.getByRole("button", { name: /Use URL/ }).click();
      // Either the URL pane shows the success state OR the manual-entry
      // dialog opens (no_metadata fallback). Both are valid outcomes.
      await expect
        .poll(async () => {
          const urlSet = await page.getByText(/Product URL/).isVisible();
          const manual = await page
            .getByRole("dialog")
            .getByText(/Tell us about|We couldn't read/)
            .isVisible()
            .catch(() => false);
          return urlSet || manual;
        })
        .toBeTruthy();
    });

    test("private-IP URL is rejected client-side before the API call", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.getByRole("tab", { name: /URL/ }).click();
      await page
        .getByPlaceholder("https://example.com/product")
        .fill("https://10.0.0.1/secret");
      await page.getByRole("button", { name: /Use URL/ }).click();
      await expect(page.getByText(/Private or link-local/)).toBeVisible();
    });
  },
);
