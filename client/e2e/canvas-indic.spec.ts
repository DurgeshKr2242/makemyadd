/**
 * canvas-indic.spec.ts — Indic rendering safety
 *
 * The font-proxy chain (app/api/fonts/* + app/api/fontfile/*) is the critical
 * layer that prevents canvas taint. If any font is loaded directly from
 * Google Fonts or another cross-origin host, canvas.toDataURL() will throw
 * SecurityError — breaking every ad download.
 *
 * These tests run against the public /templates page (no auth required) which
 * renders one FabricCanvas per template in English. The canvas taint test
 * asserts that toDataURL() succeeds, catching the entire class of cross-origin
 * font bugs.
 *
 * Per-language switching lives on the auth-gated /dashboard. Those flows are
 * exercised manually or via authenticated E2E (TODO: add Supabase test user
 * fixture in a follow-up).
 */
import { expect, test } from "@playwright/test";

test.describe("canvas — Indic safety", () => {
  test("/templates renders all fabric canvases without console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/templates");
    // Wait for at least one canvas to mount
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });

    // All templates seeded — assert at least one renders
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);

    // Filter out benign Next.js dev / source-map noise. We only care about
    // real runtime errors.
    const realErrors = consoleErrors.filter(
      (e) => !/source map|sourcemap|favicon\.ico|\[Fast Refresh\]/i.test(e),
    );
    expect(realErrors, realErrors.join("\n")).toEqual([]);
  });

  test("/templates — first canvas toDataURL succeeds (no canvas taint)", async ({
    page,
  }) => {
    await page.goto("/templates");
    // Wait for at least one canvas to mount
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });

    // The actual taint test — call toDataURL on the canvas element. If
    // any cross-origin font / image was drawn, this throws SecurityError.
    const dataUrlInfo = await page
      .locator("canvas")
      .first()
      .evaluate((el) => {
        const canvas = el as HTMLCanvasElement;
        try {
          const url = canvas.toDataURL("image/png");
          return {
            ok: true as const,
            len: url.length,
            prefix: url.slice(0, 22),
          };
        } catch (err) {
          return {
            ok: false as const,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      });

    expect(dataUrlInfo.ok, JSON.stringify(dataUrlInfo)).toBe(true);
    if (dataUrlInfo.ok) {
      expect(dataUrlInfo.prefix).toBe("data:image/png;base64,");
      // A real canvas base64 PNG is at least ~1KB. A blank one is ~200B.
      // Use a low floor so a render-error empty canvas still fails.
      expect(dataUrlInfo.len).toBeGreaterThan(2_000);
    }
  });

  test("/templates — all canvases pass toDataURL (no canvas taint on any template)", async ({
    page,
  }) => {
    await page.goto("/templates");
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });

    // Wait for all canvases to be visible
    await page.waitForTimeout(2_000);

    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);

    // Check every canvas for taint — if a single template has a bad font URL,
    // its toDataURL throws and this catches it.
    const results = await page.locator("canvas").evaluateAll((canvases) =>
      canvases.map((el, i) => {
        const canvas = el as HTMLCanvasElement;
        try {
          const url = canvas.toDataURL("image/png");
          return { index: i, ok: true as const, len: url.length };
        } catch (err) {
          return {
            index: i,
            ok: false as const,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    const failed = results.filter((r) => !r.ok);
    expect(
      failed,
      `Canvas taint detected on ${failed.length} canvas(es): ${JSON.stringify(failed)}`,
    ).toHaveLength(0);

    // All should produce a meaningful image (not blank)
    for (const r of results) {
      if (r.ok) {
        expect(r.len).toBeGreaterThan(2_000);
      }
    }
  });
});
