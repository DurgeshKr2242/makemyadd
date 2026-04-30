import { describe, expect, it } from "vitest";

import { buildCsp } from "./csp";

describe("buildCsp", () => {
  it("includes default-src 'self'", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toContain("default-src 'self'");
  });

  it("allows Razorpay + Turnstile in script-src + frame-src", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toMatch(/script-src[^;]*checkout\.razorpay\.com/);
    expect(csp).toMatch(/script-src[^;]*challenges\.cloudflare\.com/);
    expect(csp).toMatch(/frame-src[^;]*checkout\.razorpay\.com/);
    expect(csp).toMatch(/frame-src[^;]*challenges\.cloudflare\.com/);
  });

  it("allows blob: + data: in img-src for upload previews", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toMatch(/img-src[^;]*\bblob:/);
    expect(csp).toMatch(/img-src[^;]*\bdata:/);
  });

  it("allows Supabase websocket origin in connect-src", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toMatch(/connect-src[^;]*wss:\/\/\*\.supabase\.co/);
  });

  it("forbids 'unsafe-eval' + 'unsafe-inline' in script-src in production", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("allows 'unsafe-eval' + 'unsafe-inline' in script-src in dev only (HMR)", () => {
    const csp = buildCsp({ isDev: true });
    expect(csp).toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(csp).toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("denies object embeds + frame ancestors (clickjacking)", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("includes upgrade-insecure-requests directive", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
