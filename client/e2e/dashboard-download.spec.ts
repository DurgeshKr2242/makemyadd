import { Buffer } from "node:buffer";

import { expect, test } from "@playwright/test";

/**
 * Locks in the dashboard's full file → canvas → download loop that
 * shipped in d5cd052. Refactors of DashboardShell, CanvasPreview, or
 * FabricCanvas that quietly break this flow will fail CI here.
 *
 * What we cover:
 *   1. Dashboard renders + first canvas mounts (already covered by
 *      dashboard-flow.spec, asserted again here for clarity).
 *   2. Drag-drop file upload (via setInputFiles) flows into the
 *      dashboard's extractedProduct state.
 *   3. The "extracted product" badge appears with the filename.
 *   4. The canvas re-renders after the file is mounted (we observe
 *      this via toDataURL() returning a different signature than the
 *      pre-upload SAMPLE_IMAGE render).
 *   5. Clicking Download triggers a real browser download with a
 *      filename matching `adcreator-<slug>-<iso>.png`.
 *   6. The success toast appears.
 */

// 1×1 transparent PNG, the smallest valid PNG. Playwright's setInputFiles
// accepts a buffer + a name, so we don't need a real file on disk.
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63f8cf00000003000100faaa00500000000049454e44ae426082",
  "hex",
);

test.describe("dashboard end-to-end loop", () => {
  test("upload PNG → extracted badge + canvas updates → Download saves a real PNG + toast", async ({
    page,
  }, testInfo) => {
    // ─── Setup ─────────────────────────────────────────────────────────────
    await page.goto("/dashboard");
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });

    // Capture the pre-upload toDataURL signature so we can confirm the
    // canvas actually re-rendered after the file mounts.
    const beforeUpload = await page
      .locator("canvas")
      .first()
      .evaluate((el) =>
        (el as HTMLCanvasElement).toDataURL("image/png").slice(0, 64),
      );

    // ─── Upload a real PNG via the InputForm's hidden input ────────────────
    // The Upload tab is the default. Find the hidden file input by accept-type.
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "festival-saree-test.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    // ─── Extracted-product badge appears with the filename ────────────────
    // The badge format is the bare filename with extension stripped.
    // Use exact match to avoid colliding with the file picker which shows
    // "festival-saree-test.png" (with extension).
    await expect(
      page.getByText("festival-saree-test", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });

    // ─── Canvas re-rendered with the new product image ────────────────────
    // Give the canvas a moment to re-render (FabricCanvas useEffect deps).
    await page.waitForTimeout(800);
    const afterUpload = await page
      .locator("canvas")
      .first()
      .evaluate((el) =>
        (el as HTMLCanvasElement).toDataURL("image/png").slice(0, 64),
      );
    expect(
      afterUpload,
      "canvas should re-render with the uploaded file's image",
    ).not.toBe(beforeUpload);

    // ─── Click Download → real PNG saves ──────────────────────────────────
    // Playwright captures download events even when the browser doesn't
    // actually write to disk. We assert the suggested filename.
    const downloadPromise = page.waitForEvent("download", { timeout: 5_000 });
    await page.getByRole("button", { name: "Download", exact: true }).click();
    const download = await downloadPromise;

    // Filename pattern: adcreator-<slug>-<iso-timestamp>.png
    expect(download.suggestedFilename()).toMatch(
      /^adcreator-festival-saree-test-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.png$/,
    );

    // Save the download to the test-results dir so a flake report has the
    // actual PNG attached. The .png we wrote ends up in
    // test-results/dashboard-download-*/[suggested-filename].png
    const savedPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(savedPath);

    // ─── Sonner toast confirms the save ───────────────────────────────────
    // Sonner toasts render with role="status" by default.
    await expect(page.getByText(/Downloaded/i).first()).toBeVisible({
      timeout: 3_000,
    });
  });

  test("downloading without uploading still works (default SAMPLE_IMAGE → PNG)", async ({
    page,
  }) => {
    // Confirms the Download path doesn't depend on having uploaded — a
    // user opening the dashboard fresh can still grab the default canvas.
    await page.goto("/dashboard");
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 5_000 });
    await page.getByRole("button", { name: "Download", exact: true }).click();
    const download = await downloadPromise;

    // No extracted product → slug falls back to "ad"
    expect(download.suggestedFilename()).toMatch(
      /^adcreator-ad-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.png$/,
    );

    await expect(page.getByText(/Downloaded/i).first()).toBeVisible({
      timeout: 3_000,
    });
  });
});
