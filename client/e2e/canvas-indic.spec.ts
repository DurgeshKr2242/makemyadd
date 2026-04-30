/**
 * canvas-indic.spec.ts — Indic rendering safety
 *
 * The font-proxy chain (app/api/fonts/* + app/api/fontfile/*) is the critical
 * layer that prevents canvas taint. If any font is loaded directly from
 * Google Fonts or another cross-origin host, canvas.toDataURL() will throw
 * SecurityError — breaking every ad download.
 *
 * Two-pronged coverage:
 *
 * 1. /templates (public, English rendering) — every one of the 10 seeded
 *    canvases must pass canvas.toDataURL() to confirm the font proxy works
 *    on the English path for all template configs.
 *
 * 2. /dashboard (passes through in dev mode when Supabase env is unset) —
 *    drives the language picker through en/hi/ta/te and asserts toDataURL()
 *    succeeds in each script. This is the high-value Indic check: it's the
 *    one place where Devanagari / Tamil / Telugu fonts actually load via
 *    the proxy.
 *
 * Once a Supabase test user fixture lands, the dashboard tests will still
 * work — middleware only blocks when env IS set AND no session, which a
 * fixture would handle.
 */
import { expect, test } from "@playwright/test";

const LANGS = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
] as const;

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

  // The high-value Indic check — dashboard canvas across all 4 languages.
  for (const lang of LANGS) {
    test(`/dashboard — canvas renders ${lang.code} (${lang.name}) without taint`, async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.locator("canvas").first().waitFor({ timeout: 15_000 });

      // The LanguagePicker renders chip buttons with the native script as
      // their accessible name. Click the matching one.
      await page.getByRole("button", { name: lang.name, exact: true }).click();

      // Allow the canvas to re-render with the new language's font.
      await page.waitForTimeout(1_000);

      // The taint test — call toDataURL on the rendered canvas. If a
      // cross-origin font snuck in (bypassing the /api/fonts proxy), the
      // canvas is tainted and this throws SecurityError.
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
        expect(dataUrlInfo.len).toBeGreaterThan(2_000);
      }
    });
  }
});
