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

  it("forbids 'unsafe-eval' in script-src in production (allowed in dev for HMR)", () => {
    const prodCsp = buildCsp({ isDev: false });
    expect(prodCsp).not.toMatch(/script-src[^;]*'unsafe-eval'/);

    const devCsp = buildCsp({ isDev: true });
    expect(devCsp).toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  it("allows 'unsafe-inline' in script-src for Next.js inline RSC bootstrap", () => {
    // Next.js App Router emits inline hydration scripts. Without this,
    // React never hydrates client components — see csp.ts file-header
    // comment for the nonce-refactor TODO.
    const csp = buildCsp({ isDev: false });
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
