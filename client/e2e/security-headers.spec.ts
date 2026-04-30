import { expect, test } from "@playwright/test";

/**
 * Verifies the production security headers actually reach the browser
 * AND that the existing pages don't trigger CSP violations on render.
 *
 * Failure here means either:
 *   (a) headers() in next.config got dropped / mis-keyed
 *   (b) a new resource (font, script, iframe, image origin) was added
 *       without updating the CSP allowlist in lib/security/csp.ts
 *
 * Both are real bugs we want to catch on push.
 */
test.describe("security headers", () => {
  test("/ — sends CSP, X-Frame-Options, Permissions-Policy", async ({
    request,
  }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const headers = res.headers();

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toMatch(
      /script-src[^;]*checkout\.razorpay\.com/,
    );

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["permissions-policy"]).toContain("interest-cohort=()");
  });

  test("/dashboard — pages still load without CSP violations", async ({
    page,
  }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        /content security policy|csp/i.test(msg.text())
      ) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto("/dashboard");
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });
    // Give any async font / image loads a beat to fire CSP errors
    await page.waitForTimeout(1_500);

    expect(
      cspViolations,
      `CSP violations on /dashboard:\n${cspViolations.join("\n")}`,
    ).toEqual([]);
  });

  test("/templates — Fabric canvas loads without CSP violations", async ({
    page,
  }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        /content security policy|csp/i.test(msg.text())
      ) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto("/templates");
    await page.locator("canvas").first().waitFor({ timeout: 15_000 });
    await page.waitForTimeout(1_500);

    expect(
      cspViolations,
      `CSP violations on /templates:\n${cspViolations.join("\n")}`,
    ).toEqual([]);
  });
});
