# Product Extraction + R2 Upload Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the URL-extraction path with DNS-based SSRF protection, JSON-LD Product schema parsing, content sanitization, login-wall + adult-content detection. Wire the R2 client + presigned-upload pipeline. Build the Groq Vision photo-extraction branch and a `<ManualEntryDialog>` fallback so the dashboard's Step 01 → Product is functional end-to-end across URL paste, photo upload, and manual entry.

**Architecture:** Three phases (A: URL hardening, no R2 dependency; B: R2 client + upload presign + UploadPane wiring; C: image re-hosting + photo path via Groq Vision + manual-entry dialog). Each phase ends in a checkpoint commit and is independently testable. R2-dependent code follows the existing inert-when-no-keys pattern (`isR2Configured()` gate + 503 `r2_not_configured`) so the app stays bootable while the user is still configuring R2.

**Tech Stack:** Next.js 16 App Router, Cheerio (HTML parsing), `dns/promises` (DNS resolution), `isomorphic-dompurify` (sanitization), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (already deps), `groq-sdk` (already a dep), React Hook Form + Zod, Base UI Dialog, sonner toasts, Vitest, Playwright.

---

## File Structure

**New (10):**
- `client/lib/scrape/dns-guard.ts` — promisified `dns.lookup` + private-range check.
- `client/lib/scrape/dns-guard.test.ts`
- `client/lib/scrape/json-ld.ts` — `<script type="application/ld+json">` Product schema parser.
- `client/lib/scrape/json-ld.test.ts`
- `client/lib/scrape/blocklist.ts` — adult/restricted keyword filter.
- `client/lib/scrape/blocklist.test.ts`
- `client/lib/scrape/login-wall.ts` — heuristic detection.
- `client/lib/scrape/login-wall.test.ts`
- `client/lib/scrape/rehost-image.ts` — fetch + R2 upload wrapper.
- `client/lib/scrape/rehost-image.test.ts`
- `client/lib/groq/vision.ts` — Groq Vision client wrapper.
- `client/lib/groq/vision.test.ts`
- `client/lib/r2/client.test.ts`
- `client/components/generate/manual-entry-dialog.tsx`
- `client/e2e/extraction-flow.spec.ts` (gated on `E2E_LIVE_R2`)

**Modified (8):**
- `client/lib/r2/client.ts` — add `uploadToR2`, `presignPut`, `publicUrl`, `isR2Configured`.
- `client/lib/scrape/cheerio.ts` — wire DNS guard, JSON-LD, DOMPurify, blocklist, login-wall, rehost.
- `client/lib/schemas/generation.ts` — add `brand`, `price` to `ExtractResponseSchema`; add `ManualEntrySchema`.
- `client/app/api/upload/presign/route.ts` — implement presign + 503 inert path.
- `client/app/api/upload/presign/route.test.ts` — extend to cover the new behaviors.
- `client/app/api/generate/extract/route.ts` — surface new error codes; photo path.
- `client/app/api/generate/extract/route.test.ts` — extend.
- `client/components/generate/url-pane.tsx` — richer extracted card, "Edit" → opens dialog.
- `client/components/generate/input-form.tsx` — extend `InputValue` union; wire UploadPane to presign.
- `client/app/(dashboard)/dashboard/dashboard-shell.tsx` — mount `<ManualEntryDialog>`, route open events.
- `client/package.json` — add `isomorphic-dompurify`.
- `client/.env.example` — document `GROQ_VISION_MODEL`.

---

# Phase A — URL hardening

## Task 1: DNS-resolve SSRF guard

**Files:**
- Create: `client/lib/scrape/dns-guard.ts`
- Create: `client/lib/scrape/dns-guard.test.ts`

The bare-string regex in `cheerio.ts` blocks IP literals like `https://10.0.0.1`, but a hostile site can register `evil.com` with an A record pointing to `10.0.0.1` — this guard closes that bypass.

- [ ] **Step 1: Write the failing test**

Create `client/lib/scrape/dns-guard.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn() },
  lookup: vi.fn(),
}));

import * as dns from "node:dns/promises";

import { isPrivateAddress, resolvePublicHostname } from "./dns-guard";

afterEach(() => vi.restoreAllMocks());

describe("isPrivateAddress", () => {
  it.each([
    ["10.0.0.1", true],
    ["10.255.255.254", true],
    ["172.16.0.1", true],
    ["172.31.255.254", true],
    ["192.168.1.1", true],
    ["127.0.0.1", true],
    ["169.254.169.254", true], // cloud metadata
    ["100.64.0.1", true], // CGNAT
    ["::1", true],
    ["fc00::1", true],
    ["fe80::1", true],
    ["8.8.8.8", false],
    ["1.1.1.1", false],
    ["2001:4860:4860::8888", false],
    ["172.32.0.1", false], // just outside RFC1918 range
    ["172.15.255.254", false],
  ])("classifies %s correctly (%s)", (ip, expected) => {
    expect(isPrivateAddress(ip)).toBe(expected);
  });
});

describe("resolvePublicHostname", () => {
  it("returns ok when all answers are public", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([
      { address: "104.21.50.1", family: 4 },
      { address: "172.67.140.1", family: 4 },
    ] as never);
    const r = await resolvePublicHostname("example.com");
    expect(r).toEqual({ ok: true });
  });

  it("rejects when ANY answer resolves to a private address", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([
      { address: "104.21.50.1", family: 4 },
      { address: "10.0.0.5", family: 4 }, // poisoned
    ] as never);
    const r = await resolvePublicHostname("evil.com");
    expect(r).toEqual({ ok: false, reason: "resolves_to_private:10.0.0.5" });
  });

  it("rejects on lookup error (NXDOMAIN, etc.)", async () => {
    vi.mocked(dns.lookup).mockRejectedValue(
      Object.assign(new Error("nx"), { code: "ENOTFOUND" }),
    );
    const r = await resolvePublicHostname("nx.example");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/scrape/dns-guard.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/lib/scrape/dns-guard.ts`:

```ts
/**
 * DNS-based SSRF guard. The string-level guard in cheerio.ts blocks IP
 * literals like https://10.0.0.1; this layer also blocks hostnames whose
 * A/AAAA records resolve to private space — closes the
 * "register evil.com → A 10.0.0.1" bypass.
 */
import "server-only";

import * as dns from "node:dns/promises";

/** RFC1918 + link-local + loopback + cloud metadata + CGNAT. */
export function isPrivateAddress(ip: string): boolean {
  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  // IPv6
  const v6 = ip.toLowerCase();
  if (v6 === "::1") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // fc00::/7
  if (v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb")) {
    return true; // fe80::/10
  }
  return false;
}

export async function resolvePublicHostname(
  hostname: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const answers = await dns.lookup(hostname, { all: true });
    for (const a of answers) {
      if (isPrivateAddress(a.address)) {
        return { ok: false, reason: `resolves_to_private:${a.address}` };
      }
    }
    return { ok: true };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code ?? "lookup_failed";
    return { ok: false, reason: `dns_lookup_failed:${code}` };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && pnpm exec vitest run lib/scrape/dns-guard.test.ts`
Expected: PASS — 19 tests green.

- [ ] **Step 5: Commit**

```bash
git add client/lib/scrape/dns-guard.ts client/lib/scrape/dns-guard.test.ts
git commit -m "feat(scrape): DNS-resolve SSRF guard for hostnames pointing to private space"
```

---

## Task 2: JSON-LD Product schema parser

**Files:**
- Create: `client/lib/scrape/json-ld.ts`
- Create: `client/lib/scrape/json-ld.test.ts`

Most modern Indian D2C sites (Shopify, WooCommerce, custom carts) ship a `<script type="application/ld+json">` with `@type: Product`. We try this FIRST because it's machine-readable and richer than OG tags.

- [ ] **Step 1: Write the failing test**

Create `client/lib/scrape/json-ld.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { extractJsonLdProduct } from "./json-ld";

describe("extractJsonLdProduct", () => {
  it("returns null when no ld+json script is present", () => {
    expect(extractJsonLdProduct("<html><head></head><body></body></html>")).toBeNull();
  });

  it("returns null when ld+json present but no Product type", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Article","headline":"x"}</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)).toBeNull();
  });

  it("extracts a flat Product", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "Festival Saree",
        "description": "Hand-woven cotton saree in saffron",
        "image": "https://shop.example.in/saree.jpg",
        "brand": "Anokhi",
        "offers": { "price": "1999.00", "priceCurrency": "INR" }
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)).toEqual({
      name: "Festival Saree",
      description: "Hand-woven cotton saree in saffron",
      image: "https://shop.example.in/saree.jpg",
      brand: "Anokhi",
      price: { amount: 1999, currency: "INR" },
    });
  });

  it("extracts a brand object form", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "X",
        "brand": { "@type": "Brand", "name": "Anokhi" }
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)?.brand).toBe("Anokhi");
  });

  it("extracts the first image when array form is used", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "X",
        "image": ["https://shop.example.in/1.jpg","https://shop.example.in/2.jpg"]
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)?.image).toBe("https://shop.example.in/1.jpg");
  });

  it("walks @graph arrays for the Product entry", () => {
    const html = `<html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "name": "Shop" },
          { "@type": "Product", "name": "Mango", "description": "Sweet" }
        ]
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)).toEqual({
      name: "Mango",
      description: "Sweet",
      image: undefined,
      brand: undefined,
      price: undefined,
    });
  });

  it("ignores corrupt JSON in one block and tries the next", () => {
    const html = `<html><head>
      <script type="application/ld+json">{ broken json</script>
      <script type="application/ld+json">{
        "@type": "Product",
        "name": "Recovered"
      }</script>
    </head></html>`;
    expect(extractJsonLdProduct(html)?.name).toBe("Recovered");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/scrape/json-ld.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/lib/scrape/json-ld.ts`:

```ts
/**
 * JSON-LD Product schema parser. Tried before OG tags because schema.org
 * Product gives us name, description, image, brand, AND price/currency in
 * one machine-readable payload — the foundation for the rich extracted card.
 */
import "server-only";

import { load } from "cheerio";

export type LdProduct = {
  name?: string;
  description?: string;
  image?: string;
  brand?: string;
  price?: { amount: number; currency: string };
};

type Json =
  | string
  | number
  | boolean
  | null
  | { [k: string]: Json }
  | Json[];

function asString(v: Json): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function flattenType(t: Json): string[] {
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.flatMap(flattenType);
  return [];
}

function isProduct(node: Json): node is Record<string, Json> {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  return flattenType((node as Record<string, Json>)["@type"] ?? null).includes(
    "Product",
  );
}

function extractImage(v: Json): string | undefined {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) {
    for (const item of v) {
      const u = extractImage(item);
      if (u) return u;
    }
    return undefined;
  }
  if (v && typeof v === "object" && "url" in v) {
    const u = (v as Record<string, Json>)["url"];
    return typeof u === "string" ? u : undefined;
  }
  return undefined;
}

function extractBrand(v: Json): string | undefined {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const name = (v as Record<string, Json>)["name"];
    return typeof name === "string" ? name.trim() : undefined;
  }
  return undefined;
}

function extractPrice(
  v: Json,
): { amount: number; currency: string } | undefined {
  if (!v || typeof v !== "object") return undefined;
  // offers can be an object OR an array of offers
  const offers = Array.isArray(v) ? v[0] : (v as Record<string, Json>);
  if (!offers || typeof offers !== "object" || Array.isArray(offers)) {
    return undefined;
  }
  const rawPrice = offers["price"];
  const currency = offers["priceCurrency"];
  if (typeof currency !== "string" || currency.length < 3) return undefined;
  const amount =
    typeof rawPrice === "number"
      ? rawPrice
      : typeof rawPrice === "string"
        ? Number(rawPrice)
        : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return { amount, currency: currency.slice(0, 3).toUpperCase() };
}

function findProduct(node: Json): Record<string, Json> | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProduct(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (isProduct(node)) return node as Record<string, Json>;
  // Walk @graph or arbitrary nested values
  for (const v of Object.values(node)) {
    const found = findProduct(v as Json);
    if (found) return found;
  }
  return null;
}

export function extractJsonLdProduct(html: string): LdProduct | null {
  const $ = load(html);
  const blocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).contents().text())
    .get();

  for (const raw of blocks) {
    let parsed: Json;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const product = findProduct(parsed);
    if (!product) continue;
    return {
      name: asString(product["name"] ?? null),
      description: asString(product["description"] ?? null),
      image: extractImage(product["image"] ?? null),
      brand: extractBrand(product["brand"] ?? null),
      price: extractPrice(product["offers"] ?? null),
    };
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && pnpm exec vitest run lib/scrape/json-ld.test.ts`
Expected: PASS — 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add client/lib/scrape/json-ld.ts client/lib/scrape/json-ld.test.ts
git commit -m "feat(scrape): JSON-LD Product schema parser (name/desc/image/brand/price)"
```

---

## Task 3: Adult/restricted content blocklist

**Files:**
- Create: `client/lib/scrape/blocklist.ts`
- Create: `client/lib/scrape/blocklist.test.ts`

A small keyword filter that runs after we have extracted name + description but BEFORE any LLM call. Catches obviously restricted content (adult, gambling, illegal pharma) so we don't pay Groq tokens for content we won't surface.

- [ ] **Step 1: Write the failing test**

Create `client/lib/scrape/blocklist.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { containsRestrictedKeyword } from "./blocklist";

describe("containsRestrictedKeyword", () => {
  it.each([
    "Buy authentic Festival Saree",
    "Hand-woven cotton T-shirt for kids",
    "Premium organic ghee from Kerala",
    "Modular kitchen for small homes",
  ])("accepts harmless product copy: %s", (s) => {
    expect(containsRestrictedKeyword(s)).toBe(false);
  });

  it.each([
    "Adult toy with discreet packaging",
    "casino bonus signup offer",
    "buy steroids online bulk discount",
    "porn DVD collector edition",
  ])("flags restricted copy: %s", (s) => {
    expect(containsRestrictedKeyword(s)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(containsRestrictedKeyword("Free CASINO chips")).toBe(true);
  });

  it("matches whole-word only — does not flag substrings", () => {
    // "Casinopolis" the imaginary game franchise should NOT match "casino"
    expect(containsRestrictedKeyword("Buy Casinopolis vinyl")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/scrape/blocklist.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/lib/scrape/blocklist.ts`:

```ts
/**
 * Restricted-content keyword filter. Runs on extracted product copy BEFORE
 * any LLM call. Whole-word matching is intentional — substring matching
 * fires false positives ("Casinopolis vinyl" should not be blocked).
 *
 * Phase 2 wires LLM-based moderation; this is the cheap MVP gate.
 */
import "server-only";

const RESTRICTED = [
  "adult toy",
  "adult dvd",
  "porn",
  "pornography",
  "escort",
  "sex toy",
  "casino",
  "gambling",
  "betting site",
  "steroid",
  "steroids",
  "anabolic",
  "viagra",
  "cocaine",
  "heroin",
  "cannabis",
  "marijuana",
  "weed delivery",
];

const PATTERN = new RegExp(
  `\\b(?:${RESTRICTED.map((w) => w.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "i",
);

export function containsRestrictedKeyword(text: string): boolean {
  return PATTERN.test(text);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && pnpm exec vitest run lib/scrape/blocklist.test.ts`
Expected: PASS — 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add client/lib/scrape/blocklist.ts client/lib/scrape/blocklist.test.ts
git commit -m "feat(scrape): keyword blocklist for adult/gambling/restricted content"
```

---

## Task 4: Login-wall heuristic

**Files:**
- Create: `client/lib/scrape/login-wall.ts`
- Create: `client/lib/scrape/login-wall.test.ts`

When a user pastes a URL behind an auth wall (Amazon's logged-out version of an item, Flipkart marketplace listings), the scrape returns thin metadata. We detect the pattern and surface a clear "open manual entry" hint instead of a generic "no metadata" failure.

- [ ] **Step 1: Write the failing test**

Create `client/lib/scrape/login-wall.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { isLoginWall } from "./login-wall";

describe("isLoginWall", () => {
  it("returns false for normal product pages", () => {
    expect(
      isLoginWall({
        title: "Festival Saree — Anokhi",
        finalUrl: "https://shop.anokhi.in/products/festival-saree",
        hasNoIndex: false,
        bodyText: "Add to cart",
      }),
    ).toBe(false);
  });

  it("returns true when noindex + a login-y title", () => {
    expect(
      isLoginWall({
        title: "Sign in to your account",
        finalUrl: "https://shop.example.in/products/x",
        hasNoIndex: true,
        bodyText: "",
      }),
    ).toBe(true);
  });

  it("returns true when final URL is a login redirect", () => {
    expect(
      isLoginWall({
        title: "Anything",
        finalUrl: "https://shop.example.in/account/login?redirect=/products/x",
        hasNoIndex: false,
        bodyText: "",
      }),
    ).toBe(true);
  });

  it("returns true when body contains 'please log in' phrase", () => {
    expect(
      isLoginWall({
        title: "Anything",
        finalUrl: "https://shop.example.in/products/x",
        hasNoIndex: false,
        bodyText: "Please log in to continue browsing",
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/scrape/login-wall.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/lib/scrape/login-wall.ts`:

```ts
/**
 * Heuristic — does this page look like an auth wall, not a product page?
 * Keep deliberately fuzzy. A false positive opens the ManualEntryDialog,
 * which the user can dismiss. A false negative gives them a "no_metadata"
 * generic error, which is worse.
 */
import "server-only";

const TITLE_RE = /sign\s*in|log\s*in|account\s*login|access\s*denied|page\s*not\s*found|404/i;

const URL_PATH_RE = /\/(login|signin|sign-in|account\/login|auth\/login)/i;

const BODY_PHRASES = [
  /please\s+log\s+in/i,
  /sign\s+in\s+to\s+continue/i,
  /you\s+must\s+be\s+logged\s+in/i,
];

export function isLoginWall(input: {
  title: string;
  finalUrl: string;
  hasNoIndex: boolean;
  bodyText: string;
}): boolean {
  if (input.hasNoIndex && TITLE_RE.test(input.title)) return true;
  try {
    const u = new URL(input.finalUrl);
    if (URL_PATH_RE.test(u.pathname)) return true;
  } catch {
    // ignore — bad URL = can't determine login wall this way
  }
  if (BODY_PHRASES.some((re) => re.test(input.bodyText))) return true;
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && pnpm exec vitest run lib/scrape/login-wall.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add client/lib/scrape/login-wall.ts client/lib/scrape/login-wall.test.ts
git commit -m "feat(scrape): login-wall heuristic for marketplace auth-required pages"
```

---

## Task 5: Wire all hardening into cheerio.ts + extract route

**Files:**
- Modify: `client/lib/scrape/cheerio.ts` — add DNS guard, JSON-LD priority, login-wall check, blocklist, sanitize.
- Modify: `client/lib/schemas/generation.ts` — extend `ExtractResponseSchema` with `brand`, `price`.
- Modify: `client/app/api/generate/extract/route.ts` — surface new error codes.
- Modify: `client/lib/scrape/cheerio.test.ts` — add new error-path tests.
- Modify: `client/app/api/generate/extract/route.test.ts` — add new error-path tests.
- Modify: `client/package.json` — add `isomorphic-dompurify`.

This is the integration task that wires Tasks 1–4 into the scrape path. We add a single new dep (`isomorphic-dompurify`), broaden `ScrapeError`'s code union, and update the route's status mapping.

- [ ] **Step 1: Add the DOMPurify dep**

Run:

```bash
cd client && pnpm add isomorphic-dompurify
```

Expected: clean install. `package.json` + `pnpm-lock.yaml` updated.

- [ ] **Step 2: Extend the ExtractResponseSchema**

Replace the `ExtractResponseSchema` in `client/lib/schemas/generation.ts`:

```ts
export const ExtractResponseSchema = z.object({
  productName: z.string().min(1).max(200),
  productDesc: z.string().max(2000),
  productImageUrl: z.string().url(),
  category: z.enum(CATEGORIES).optional(),
  brand: z.string().max(80).optional(),
  price: z
    .object({
      amount: z.number().positive(),
      currency: z.string().length(3),
    })
    .optional(),
});
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;
```

- [ ] **Step 3: Update cheerio.ts to integrate the new modules**

Replace the entire body of `client/lib/scrape/cheerio.ts` with the version below. Key changes:
- Imports the four new modules + `DOMPurify`.
- After `isPublicHttpsUrl` passes, calls `resolvePublicHostname()` for the DNS-level check.
- Tries `extractJsonLdProduct(html)` FIRST; falls through to OG tags.
- Sanitizes every extracted string.
- After name + desc are extracted, checks `containsRestrictedKeyword` and `isLoginWall`.
- Adds two new `ScrapeError` codes: `dns_blocked`, `login_wall`, `restricted_content`.
- Returns the new optional `brand` + `price`.

```ts
import "server-only";
import { load } from "cheerio";
import DOMPurify from "isomorphic-dompurify";

import { containsRestrictedKeyword } from "./blocklist";
import { resolvePublicHostname } from "./dns-guard";
import { extractJsonLdProduct } from "./json-ld";
import { isLoginWall } from "./login-wall";

const FETCH_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const ALLOWED_DESC_LEN = 500;
const ALLOWED_NAME_LEN = 200;

export type ScrapedProduct = {
  productName: string;
  productDesc: string;
  productImageUrl?: string;
  brand?: string;
  price?: { amount: number; currency: string };
};

export class ScrapeError extends Error {
  constructor(
    public readonly code:
      | "invalid_url"
      | "dns_blocked"
      | "blocked_host"
      | "fetch_failed"
      | "timeout"
      | "body_too_large"
      | "no_metadata"
      | "login_wall"
      | "restricted_content",
    message: string,
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}

export function isPublicHttpsUrl(
  input: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "not a URL" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "must be https" };
  const host = url.hostname.toLowerCase();
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return { ok: false, reason: "IP literals not allowed" };
  }
  if (host.includes(":")) return { ok: false, reason: "IP literals not allowed" };
  const BLOCKED = ["localhost", "metadata.google.internal", "metadata"];
  if (
    BLOCKED.includes(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return { ok: false, reason: `blocked host: ${host}` };
  }
  return { ok: true, url };
}

export async function scrapeProductUrl(input: string): Promise<ScrapedProduct> {
  const guard = isPublicHttpsUrl(input);
  if (!guard.ok) throw new ScrapeError("invalid_url", guard.reason);
  const { url } = guard;

  // DNS-level SSRF guard — closes the "evil.com → A 10.0.0.1" bypass.
  const dnsCheck = await resolvePublicHostname(url.hostname);
  if (!dnsCheck.ok) {
    throw new ScrapeError("dns_blocked", dnsCheck.reason);
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.href, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AdCreatorBot/1.0 (+https://adcreator.in)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ScrapeError("timeout", `fetch timeout after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw new ScrapeError(
      "fetch_failed",
      err instanceof Error ? err.message : String(err),
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new ScrapeError("fetch_failed", `upstream ${response.status}`);
  }

  const declaredLen = Number(response.headers.get("content-length") ?? "0");
  if (declaredLen > MAX_BODY_BYTES) {
    throw new ScrapeError("body_too_large", `${declaredLen} bytes > ${MAX_BODY_BYTES}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("xml")) {
    throw new ScrapeError("fetch_failed", `unsupported content-type: ${contentType}`);
  }

  const html = await readWithLimit(response, MAX_BODY_BYTES);

  // ─── JSON-LD takes priority — richer data when available ────────────────
  const ld = extractJsonLdProduct(html);

  // ─── OG / fallback parse ─────────────────────────────────────────────────
  const $ = load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const docTitle = $("title").first().text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  const h1 = $("h1").first().text().trim();
  const robots = $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
  const hasNoIndex = robots.includes("noindex");
  const bodyText = $("body").text().slice(0, 4000);

  // Login-wall detection runs against the assembled signal set.
  if (isLoginWall({ title: ld?.name ?? ogTitle ?? docTitle ?? "", finalUrl: response.url, hasNoIndex, bodyText })) {
    throw new ScrapeError("login_wall", "page looks like an auth wall");
  }

  const productName = sanitize(
    ld?.name ?? ogTitle ?? docTitle ?? h1 ?? "",
    ALLOWED_NAME_LEN,
  );
  const productDesc = sanitize(
    ld?.description ?? ogDesc ?? metaDesc ?? "",
    ALLOWED_DESC_LEN,
  );

  if (!productName && !productDesc) {
    throw new ScrapeError(
      "no_metadata",
      "could not find product metadata on page",
    );
  }

  // Restricted-content gate — runs only after we have something to check.
  const haystack = `${productName} ${productDesc}`;
  if (containsRestrictedKeyword(haystack)) {
    throw new ScrapeError("restricted_content", "page contains restricted keywords");
  }

  const imageRaw = ld?.image ?? ogImage;
  const productImageUrl = imageRaw ? resolveAbsolute(url, imageRaw) : undefined;

  return {
    productName: productName || "Untitled product",
    productDesc,
    productImageUrl,
    brand: ld?.brand ? sanitize(ld.brand, 80) : undefined,
    price: ld?.price,
  };
}

async function readWithLimit(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ScrapeError("body_too_large", `streamed > ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

/** Defensive — DOMPurify strips any HTML/script that snuck into a meta
 *  string (rare in og:title etc., but cheap insurance). Then collapse
 *  whitespace and truncate. */
function sanitize(input: string, maxLen: number): string {
  const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return stripped.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function resolveAbsolute(base: URL, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}
```

- [ ] **Step 4: Update extract route to map new error codes**

Modify `client/app/api/generate/extract/route.ts` — replace the `if (parsed.inputType === "url")` block:

```ts
  if (parsed.inputType === "url") {
    try {
      const product = await scrapeProductUrl(parsed.inputUrl);
      return NextResponse.json({
        productName: product.productName,
        productDesc: product.productDesc,
        productImageUrl: product.productImageUrl ?? parsed.inputUrl,
        ...(product.brand ? { brand: product.brand } : {}),
        ...(product.price ? { price: product.price } : {}),
      });
    } catch (err) {
      if (err instanceof ScrapeError) {
        return NextResponse.json(
          { error: err.code, message: err.message },
          { status: 422 },
        );
      }
      throw err;
    }
  }
```

- [ ] **Step 5: Extend cheerio.test.ts to cover the new code paths**

Append to `client/lib/scrape/cheerio.test.ts`:

```ts
describe("scrapeProductUrl — new guards", () => {
  // We mock dns.lookup at the module level; resolvePublicHostname will hit it.
  vi.mock("node:dns/promises", () => ({
    default: { lookup: vi.fn().mockResolvedValue([{ address: "104.21.1.1", family: 4 }]) },
    lookup: vi.fn().mockResolvedValue([{ address: "104.21.1.1", family: 4 }]),
  }));

  it("prefers JSON-LD Product over OG when both are present", async () => {
    const html = `<html><head>
      <meta property="og:title" content="OG Title" />
      <script type="application/ld+json">{
        "@type":"Product","name":"LD Title","description":"LD desc",
        "image":"https://shop.example.in/x.jpg","brand":"Anokhi",
        "offers":{"price":"1499","priceCurrency":"INR"}
      }</script>
    </head></html>`;
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    const r = await scrapeProductUrl("https://shop.example.in/p");
    expect(r.productName).toBe("LD Title");
    expect(r.productDesc).toBe("LD desc");
    expect(r.brand).toBe("Anokhi");
    expect(r.price).toEqual({ amount: 1499, currency: "INR" });
  });

  it("rejects pages with restricted keywords", async () => {
    const html = `<html><head>
      <meta property="og:title" content="Casino bonus" />
      <meta property="og:description" content="Sign up for free chips" />
    </head></html>`;
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    await expect(
      scrapeProductUrl("https://shop.example.in/casino"),
    ).rejects.toMatchObject({ code: "restricted_content" });
  });

  it("rejects login-wall pages", async () => {
    const html = `<html><head>
      <meta name="robots" content="noindex" />
      <title>Sign in to your account</title>
    </head><body>Please log in to continue</body></html>`;
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    await expect(
      scrapeProductUrl("https://shop.example.in/account"),
    ).rejects.toMatchObject({ code: "login_wall" });
  });
});
```

- [ ] **Step 6: Verify the suite**

Run:

```bash
cd client && pnpm exec vitest run lib/scrape/ app/api/generate/extract/
```

Expected: ALL green. (Covers Tasks 1–5 in one run.)

- [ ] **Step 7: Typecheck + lint**

Run: `cd client && pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 8: Commit (Phase A checkpoint)**

```bash
git add client/lib/scrape/cheerio.ts client/lib/scrape/cheerio.test.ts \
        client/lib/schemas/generation.ts \
        client/app/api/generate/extract/route.ts \
        client/package.json client/pnpm-lock.yaml
git commit -m "feat(scrape): integrate DNS guard + JSON-LD + sanitize + login-wall + blocklist"
```

---

# Phase B — R2 client + presigned upload pipeline

## Task 6: Fill in the R2 client

**Files:**
- Modify: `client/lib/r2/client.ts`
- Create: `client/lib/r2/client.test.ts`

The client is currently a stub. We add `uploadToR2`, `presignPut`, `publicUrl`, and an `isR2Configured` gate matching the existing inert-when-no-keys pattern.

- [ ] **Step 1: Write the failing test**

Create `client/lib/r2/client.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const send = vi.fn();
class S3ClientMock {
  send = send;
  destroy() {}
}
class PutObjectCommandMock {
  constructor(public input: unknown) {}
}
class GetObjectCommandMock {
  constructor(public input: unknown) {}
}
const getSignedUrlMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: S3ClientMock,
  PutObjectCommand: PutObjectCommandMock,
  GetObjectCommand: GetObjectCommandMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    CLOUDFLARE_ACCOUNT_ID: "acct123",
    R2_ACCESS_KEY_ID: "ak",
    R2_SECRET_ACCESS_KEY: "sk",
    R2_PUBLIC_BASE: "https://assets.adcreator.in",
    R2_BUCKET_UPLOADS: "adcreator-uploads",
    R2_BUCKET_PROCESSED: "adcreator-processed",
    R2_BUCKET_PUBLIC: "adcreator-public",
  },
  requireServerEnv: (k: string) => ({
    CLOUDFLARE_ACCOUNT_ID: "acct123",
    R2_ACCESS_KEY_ID: "ak",
    R2_SECRET_ACCESS_KEY: "sk",
  })[k as string]!,
}));

beforeEach(() => {
  send.mockReset();
  getSignedUrlMock.mockReset();
});
afterEach(() => vi.restoreAllMocks());

import {
  isR2Configured,
  presignPut,
  publicUrl,
  uploadToR2,
} from "./client";

describe("isR2Configured", () => {
  it("returns true when all required env vars are present", () => {
    expect(isR2Configured()).toBe(true);
  });
});

describe("publicUrl", () => {
  it("constructs a public URL using R2_PUBLIC_BASE for the public bucket", () => {
    expect(publicUrl("templates/festival.png", "public")).toBe(
      "https://assets.adcreator.in/templates/festival.png",
    );
  });
  it("constructs a processed-bucket URL via the same public base", () => {
    expect(publicUrl("processed/bgr-x.png", "processed")).toBe(
      "https://assets.adcreator.in/processed/bgr-x.png",
    );
  });
});

describe("uploadToR2", () => {
  it("calls S3 PutObject with the right bucket + key", async () => {
    send.mockResolvedValue({});
    const buf = new Uint8Array([1, 2, 3]);
    const r = await uploadToR2(buf, "uploads/u1/file.png", "image/png", "uploads");
    expect(send).toHaveBeenCalledOnce();
    expect(r.key).toBe("uploads/u1/file.png");
    expect(r.publicUrl).toContain("uploads/u1/file.png");
  });
});

describe("presignPut", () => {
  it("returns the signed URL string from getSignedUrl", async () => {
    getSignedUrlMock.mockResolvedValue(
      "https://acct123.r2.cloudflarestorage.com/x?signature=…",
    );
    const url = await presignPut("uploads/u1/file.png", "image/png");
    expect(url).toMatch(/r2\.cloudflarestorage\.com/);
    expect(getSignedUrlMock).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/r2/client.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement**

Replace the body of `client/lib/r2/client.ts`:

```ts
/**
 * Cloudflare R2 client — TODO §4 / §5.
 *
 * The S3-compatible client is constructed lazily so we don't pay the AWS
 * SDK import cost on routes that don't touch R2. Inert when env keys are
 * missing — `isR2Configured()` is the gate.
 */
import "server-only";

import { requireServerEnv, serverEnv } from "@/lib/env.server";

let cachedClient: unknown = null;

export const R2_BUCKETS = {
  uploads: serverEnv.R2_BUCKET_UPLOADS,
  processed: serverEnv.R2_BUCKET_PROCESSED,
  public: serverEnv.R2_BUCKET_PUBLIC,
} as const;

export type R2Bucket = keyof typeof R2_BUCKETS;

export function isR2Configured(): boolean {
  return Boolean(
    serverEnv.CLOUDFLARE_ACCOUNT_ID &&
      serverEnv.R2_ACCESS_KEY_ID &&
      serverEnv.R2_SECRET_ACCESS_KEY,
  );
}

async function getR2Client() {
  if (cachedClient) return cachedClient;
  const accountId = requireServerEnv("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = requireServerEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireServerEnv("R2_SECRET_ACCESS_KEY");
  const { S3Client } = await import("@aws-sdk/client-s3");
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient as InstanceType<typeof S3Client>;
}

export function publicUrl(key: string, _bucket: R2Bucket = "public"): string {
  const base = serverEnv.R2_PUBLIC_BASE ?? "https://assets.adcreator.in";
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export async function uploadToR2(
  body: Uint8Array | Buffer,
  key: string,
  contentType: string,
  bucket: R2Bucket = "uploads",
): Promise<{ key: string; publicUrl: string }> {
  const r2 = await getR2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKETS[bucket],
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, publicUrl: publicUrl(key, bucket) };
}

export async function presignPut(
  key: string,
  contentType: string,
  bucket: R2Bucket = "uploads",
  expiresIn = 300,
): Promise<string> {
  const r2 = await getR2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKETS[bucket],
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && pnpm exec vitest run lib/r2/client.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add client/lib/r2/client.ts client/lib/r2/client.test.ts
git commit -m "feat(r2): client helpers — uploadToR2, presignPut, publicUrl, isR2Configured"
```

---

## Task 7: Implement /api/upload/presign

**Files:**
- Modify: `client/app/api/upload/presign/route.ts`
- Modify: `client/app/api/upload/presign/route.test.ts` (if it exists; else create)

- [ ] **Step 1: Read the existing test to know its mock setup**

Run: `cd client && cat app/api/upload/presign/route.test.ts | head -40` (skim — if it doesn't yet exist, the next step creates it).

- [ ] **Step 2: Write/extend the test file**

Replace the contents of `client/app/api/upload/presign/route.test.ts` with:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  }),
}));

const isR2ConfiguredMock = vi.fn().mockReturnValue(true);
const presignPutMock = vi
  .fn()
  .mockResolvedValue("https://acct123.r2.cloudflarestorage.com/signed?x=1");
const publicUrlMock = vi
  .fn()
  .mockImplementation((k: string) => `https://assets.adcreator.in/${k}`);

vi.mock("@/lib/r2/client", () => ({
  isR2Configured: isR2ConfiguredMock,
  presignPut: presignPutMock,
  publicUrl: publicUrlMock,
}));

beforeEach(() => {
  isR2ConfiguredMock.mockReturnValue(true);
  presignPutMock.mockResolvedValue("https://acct123.r2.cloudflarestorage.com/signed?x=1");
  publicUrlMock.mockImplementation((k: string) => `https://assets.adcreator.in/${k}`);
});
afterEach(() => vi.restoreAllMocks());

import { POST } from "./route";

function reqJson(body: unknown): Request {
  return new Request("http://localhost/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/presign", () => {
  it("400s on body that doesn't match the schema", async () => {
    const res = await POST(reqJson({}) as never);
    expect(res.status).toBe(400);
  });

  it("400s on rejected content-type", async () => {
    const res = await POST(
      reqJson({
        filename: "x.heic",
        contentType: "image/heic",
        size: 1024,
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("503s when R2 isn't configured", async () => {
    isR2ConfiguredMock.mockReturnValueOnce(false);
    const res = await POST(
      reqJson({
        filename: "x.png",
        contentType: "image/png",
        size: 1024,
      }) as never,
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("r2_not_configured");
  });

  it("returns presignedUrl + key + publicUrl on success", async () => {
    const res = await POST(
      reqJson({
        filename: "festival.png",
        contentType: "image/png",
        size: 256_000,
      }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.presignedUrl).toMatch(/r2\.cloudflarestorage\.com/);
    expect(json.key).toMatch(/^uploads\/user-1\/[a-f0-9-]+\.png$/);
    expect(json.publicUrl).toContain(json.key);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run app/api/upload/presign/route.test.ts`
Expected: FAIL — route still returns 501.

- [ ] **Step 4: Implement the route**

Replace `client/app/api/upload/presign/route.ts`:

```ts
// client/app/api/upload/presign/route.ts
// Spec §5 / §11.1 — R2 presigned upload URL.
// Middleware at client/middleware.ts already gates /api/upload/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { uploadKey } from "@/lib/r2/keys";
import { isR2Configured, presignPut, publicUrl } from "@/lib/r2/client";
import { PresignRequestSchema } from "@/lib/schemas/generation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = PresignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error: "r2_not_configured",
        message:
          "Photo upload isn't configured for this environment yet. Try again later or paste a product URL.",
      },
      { status: 503 },
    );
  }

  // ext: take the part after the last dot in the original filename, fall
  // back to the contentType subtype. Lowercase + alphanumeric only — keys.ts
  // throws on anything else.
  const fromName = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "";
  const fromType = parsed.data.contentType.split("/")[1]?.toLowerCase() ?? "";
  const ext = /^[a-z0-9]+$/.test(fromName) ? fromName : fromType;

  const key = uploadKey(user.id, ext);
  const presignedUrl = await presignPut(key, parsed.data.contentType);
  return NextResponse.json({
    presignedUrl,
    key,
    publicUrl: publicUrl(key, "uploads"),
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd client && pnpm exec vitest run app/api/upload/presign/route.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add client/app/api/upload/presign/route.ts client/app/api/upload/presign/route.test.ts
git commit -m "feat(upload): /api/upload/presign — R2 presigned PUT URLs"
```

---

## Task 8: Wire UploadPane to the presign + PUT flow

**Files:**
- Modify: `client/components/generate/input-form.tsx` — extend `InputValue` union; UploadPane now drives a real upload.

We extend the discriminated union so the dashboard shell can react to upload state transitions. After a successful PUT, we automatically fire `/api/generate/extract` with `inputType: "photo"` (the photo-extract handler lands in Phase C — until then the route returns 501 cleanly).

- [ ] **Step 1: Replace the entire `client/components/generate/input-form.tsx` with the version below**

```tsx
"use client";

import { Globe, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { UrlPane } from "@/components/generate/url-pane";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type InputValue =
  | { type: "url"; url: string }
  | { type: "file"; file: File; previewUrl: string }
  | {
      type: "uploaded";
      file: File;
      previewUrl: string;
      key: string;
      publicUrl: string;
    }
  | { type: "empty" };

export interface InputFormProps {
  value: InputValue;
  onChange: (v: InputValue) => void;
  onProductExtracted?: (product: ExtractResponse) => void;
  /** Fires when the user explicitly asks for the manual-entry fallback,
   *  or when a server-side fallback is needed (no_metadata / vision_failed). */
  onRequestManualEntry?: (hint: { source: "url" | "photo" | "user"; urlIfAny?: string; imageUrlIfAny?: string }) => void;
  className?: string;
}

const PRIVATE_IP_RE =
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fd00:|fe80:)/i;

export function isAcceptableProductUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Enter a valid URL (e.g. https://example.com/product)";
  }
  if (url.protocol !== "https:") return "URL must start with https://";
  const host = url.hostname.toLowerCase();
  if (host === "localhost") return "Localhost URLs are not accepted";
  const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6BracketRe = /^\[.+]$/;
  if (ipv4Re.test(host) || ipv6BracketRe.test(host)) {
    return "IP address URLs are not accepted";
  }
  if (PRIVATE_IP_RE.test(host)) return "Private or link-local addresses are not accepted";
  if (host === "169.254.169.254") return "This address is not accepted";
  return null;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMimeType = (typeof ACCEPTED_TYPES)[number];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function isAcceptedType(mimeType: string): mimeType is AcceptedMimeType {
  return (ACCEPTED_TYPES as readonly string[]).includes(mimeType);
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "error"; message: string };

/** Upload the file to R2 via the presign route. Uses XHR so we can show
 *  upload progress (fetch can't expose it). Returns the public URL +
 *  R2 key on success. */
async function presignAndUpload(
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<{ key: string; publicUrl: string } | { error: string }> {
  // 1. Ask the server for a presigned URL
  const presign = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
    signal,
  });
  if (!presign.ok) {
    const body = (await presign.json().catch(() => null)) as { error?: string; message?: string } | null;
    return { error: body?.message ?? body?.error ?? `Upload setup failed (${presign.status})` };
  }
  const { presignedUrl, key, publicUrl } = (await presign.json()) as {
    presignedUrl: string;
    key: string;
    publicUrl: string;
  };

  // 2. PUT to R2 with progress
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve({ key, publicUrl });
      else resolve({ error: `Upload failed (${xhr.status})` });
    };
    xhr.onerror = () => resolve({ error: "Network error during upload" });
    xhr.onabort = () => resolve({ error: "Upload cancelled" });
    if (signal) signal.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}

function UploadPane({
  value,
  onChange,
}: {
  value: InputValue;
  onChange: (v: InputValue) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });

  const prevPreviewUrl = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!isAcceptedType(file.type)) {
        setError("Only JPG, PNG, and WEBP images are accepted");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("File must be 10 MB or smaller");
        return;
      }

      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
      const previewUrl = URL.createObjectURL(file);
      prevPreviewUrl.current = previewUrl;
      onChange({ type: "file", file, previewUrl });

      setUpload({ status: "uploading", progress: 0 });
      const result = await presignAndUpload(file, (pct) => {
        setUpload({ status: "uploading", progress: pct });
      });
      if ("error" in result) {
        setUpload({ status: "error", message: result.error });
        return;
      }
      setUpload({ status: "idle" });
      onChange({
        type: "uploaded",
        file,
        previewUrl,
        key: result.key,
        publicUrl: result.publicUrl,
      });
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Selected card — file picked or fully uploaded
  if (value.type === "file" || value.type === "uploaded") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 relative overflow-hidden">
        <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
          {/* biome-ignore lint/performance/noImgElement: blob URLs from URL.createObjectURL() are not compatible with next/image */}
          <img
            src={value.previewUrl}
            alt={value.file.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium truncate">{value.file.name}</p>
          <p className="text-caption mt-0.5">
            {(value.file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
            {value.file.type.split("/")[1]?.toUpperCase()}
            {value.type === "uploaded" ? " · Uploaded" : null}
          </p>
        </div>
        {upload.status === "uploading" ? (
          <span className="text-caption text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {upload.progress}%
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove file"
            onClick={() => {
              if (prevPreviewUrl.current) {
                URL.revokeObjectURL(prevPreviewUrl.current);
                prevPreviewUrl.current = null;
              }
              setUpload({ status: "idle" });
              onChange({ type: "empty" });
            }}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        )}
        {upload.status === "uploading" ? (
          <span
            className="absolute left-0 bottom-0 h-0.5 bg-primary transition-all duration-fast"
            style={{ width: `${upload.progress}%` }}
            aria-hidden
          />
        ) : null}
        {upload.status === "error" ? (
          <p
            className="absolute left-4 bottom-1 text-caption text-destructive"
            role="alert"
          >
            {upload.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-3",
          "rounded-xl border border-dashed p-10 cursor-pointer",
          "transition-colors duration-fast",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-input hover:bg-accent/40",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ImageIcon
          className={cn(
            "h-8 w-8 transition-colors duration-fast",
            isDragOver ? "text-primary" : "text-muted-foreground",
          )}
          strokeWidth={1.25}
        />
        <div className="space-y-1">
          <p className="text-body-sm">
            {isDragOver ? "Drop it here" : "Drop a photo or click to browse"}
          </p>
          <p className="text-caption">JPG, PNG, WEBP · up to 10 MB</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            inputRef.current?.click();
          }}
          tabIndex={-1}
          aria-hidden
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Choose file
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Upload product image"
        />
      </label>
      {error ? (
        <p className="text-caption text-destructive mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function InputForm({
  value,
  onChange,
  onProductExtracted,
  className,
}: InputFormProps) {
  return (
    <Tabs defaultValue="upload" className={cn("w-full", className)}>
      <TabsList className="w-full">
        <TabsTrigger value="upload" className="flex-1 gap-1.5">
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Upload
        </TabsTrigger>
        <TabsTrigger value="url" className="flex-1 gap-1.5">
          <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
          URL
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <UploadPane value={value} onChange={onChange} />
      </TabsContent>

      <TabsContent value="url" className="mt-4">
        <UrlPane
          value={value}
          onChange={onChange}
          onProductExtracted={onProductExtracted}
        />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 2: Update dashboard-shell to handle the new `uploaded` variant**

Modify `client/app/(dashboard)/dashboard/dashboard-shell.tsx`. Replace the `useEffect` block with this version (which fires the photo-extract API once an upload completes):

```tsx
  useEffect(() => {
    if (inputValue.type === "file") {
      // local-preview-only state, before R2 upload completes
      setExtractedProduct({
        productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
        productDesc: `${(inputValue.file.size / 1024).toFixed(0)} KB · ${inputValue.file.type}`,
        productImageUrl: inputValue.previewUrl,
      });
    } else if (inputValue.type === "uploaded") {
      // upload finished — fire photo extraction
      let cancelled = false;
      (async () => {
        const res = await fetch("/api/generate/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: "photo",
            imageKey: inputValue.key,
          }),
        });
        if (cancelled) return;
        if (res.ok) {
          const product = (await res.json()) as ExtractResponse;
          setExtractedProduct(product);
        } else {
          // Photo extraction backend is wired in Phase C. Until then, we
          // keep the file-stage placeholder visible so the user sees the
          // upload succeeded.
          setExtractedProduct({
            productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
            productDesc: `Uploaded · ${(inputValue.file.size / 1024).toFixed(0)} KB`,
            productImageUrl: inputValue.publicUrl,
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    } else if (inputValue.type === "empty") {
      setExtractedProduct(null);
    }
    // type === "url" — handled by UrlPane's onProductExtracted callback
  }, [inputValue]);
```

- [ ] **Step 3: Update existing input-form.test.ts assertions if they check the union shape**

Run: `cd client && pnpm exec vitest run components/generate/input-form.test.ts`
Expected: green or only minor mismatch — fix any references to the old `InputValue` shape by adding the new `uploaded` variant.

If the test breaks, expand it to cover the new variant:

```ts
it("accepts the new 'uploaded' variant in the union", () => {
  const v: InputValue = {
    type: "uploaded",
    file: new File(["x"], "x.png", { type: "image/png" }),
    previewUrl: "blob:test",
    key: "uploads/u/x.png",
    publicUrl: "https://assets.adcreator.in/uploads/u/x.png",
  };
  expect(v.type).toBe("uploaded");
});
```

- [ ] **Step 4: Verify typecheck + lint + tests**

Run:

```bash
cd client && pnpm typecheck && pnpm lint && pnpm test
```

Expected: all green.

- [ ] **Step 5: Commit (Phase B checkpoint)**

```bash
git add client/components/generate/input-form.tsx \
        client/components/generate/input-form.test.ts \
        client/app/\(dashboard\)/dashboard/dashboard-shell.tsx
git commit -m "feat(upload): UploadPane drives presign + PUT with progress; uploaded variant"
```

---

# Phase C — Image re-hosting + Vision photo path + manual entry

## Task 9: Image re-hosting helper

**Files:**
- Create: `client/lib/scrape/rehost-image.ts`
- Create: `client/lib/scrape/rehost-image.test.ts`

When the URL scrape returns an `og:image`, we fetch it and re-upload to the R2 `processed` bucket so the canvas isn't dependent on the merchant's CDN at render time. Returns `{ skipped }` (not throws) when R2 isn't configured — caller falls back to the original URL.

- [ ] **Step 1: Write the failing test**

Create `client/lib/scrape/rehost-image.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const isR2ConfiguredMock = vi.fn().mockReturnValue(true);
const uploadToR2Mock = vi
  .fn()
  .mockResolvedValue({ key: "processed/bgr-x.png", publicUrl: "https://assets.adcreator.in/processed/bgr-x.png" });
vi.mock("@/lib/r2/client", () => ({
  isR2Configured: isR2ConfiguredMock,
  uploadToR2: uploadToR2Mock,
}));

const ORIG_FETCH = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
  isR2ConfiguredMock.mockReturnValue(true);
  uploadToR2Mock.mockResolvedValue({
    key: "processed/bgr-x.png",
    publicUrl: "https://assets.adcreator.in/processed/bgr-x.png",
  });
});
afterEach(() => {
  global.fetch = ORIG_FETCH;
  vi.restoreAllMocks();
});

import { fetchAndRehostImage } from "./rehost-image";

describe("fetchAndRehostImage", () => {
  it("skips when R2 isn't configured", async () => {
    isR2ConfiguredMock.mockReturnValueOnce(false);
    const r = await fetchAndRehostImage("https://shop.example.in/x.jpg");
    expect(r).toEqual({ skipped: true, reason: "r2_not_configured" });
  });

  it("rehosts a normal image", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/x.png");
    expect(r).toMatchObject({ rehostedUrl: expect.stringContaining("processed/") });
    expect(uploadToR2Mock).toHaveBeenCalledOnce();
  });

  it("skips on 403 (hot-link protection)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("denied", { status: 403 }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/x.jpg");
    expect(r).toMatchObject({ skipped: true });
  });

  it("rejects SVG (XSS risk)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("<svg></svg>", {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/x.svg");
    expect(r).toMatchObject({ skipped: true, reason: expect.stringContaining("svg") });
  });

  it("rejects body larger than maxBytes", async () => {
    const bigBody = new Uint8Array(6_000_000);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(bigBody, {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          "content-length": String(bigBody.byteLength),
        },
      }),
    );
    const r = await fetchAndRehostImage("https://shop.example.in/big.jpg", { maxBytes: 5_000_000 });
    expect(r).toMatchObject({ skipped: true, reason: expect.stringContaining("too_large") });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/scrape/rehost-image.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/lib/scrape/rehost-image.ts`:

```ts
/**
 * Fetch an external image and re-upload to the R2 `processed` bucket.
 * Returns `{ skipped }` instead of throwing on any failure — caller falls
 * back to the original URL. Better to ship a hot-link-fragile ad than to
 * break the funnel.
 */
import "server-only";

import { processedKey } from "@/lib/r2/keys";
import { isR2Configured, uploadToR2 } from "@/lib/r2/client";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type RehostResult =
  | { rehostedUrl: string; rehostedKey: string }
  | { skipped: true; reason: string };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function fetchAndRehostImage(
  imageUrl: string,
  opts?: { timeoutMs?: number; maxBytes?: number },
): Promise<RehostResult> {
  if (!isR2Configured()) {
    return { skipped: true, reason: "r2_not_configured" };
  }
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(imageUrl, {
      signal: ac.signal,
      redirect: "follow",
      headers: { "User-Agent": "AdCreatorBot/1.0 (+https://adcreator.in)" },
    });
  } catch (err) {
    clearTimeout(timer);
    return { skipped: true, reason: `fetch_failed:${(err as Error).message ?? "unknown"}` };
  }
  clearTimeout(timer);

  if (!res.ok) return { skipped: true, reason: `upstream_${res.status}` };

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (contentType.includes("svg")) return { skipped: true, reason: "svg_disallowed" };
  if (!ALLOWED_TYPES.has(contentType)) {
    return { skipped: true, reason: `unsupported_type:${contentType}` };
  }

  const declaredLen = Number(res.headers.get("content-length") ?? "0");
  if (declaredLen > maxBytes) return { skipped: true, reason: "body_too_large" };

  const reader = res.body?.getReader();
  if (!reader) return { skipped: true, reason: "no_body" };
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { skipped: true, reason: "body_too_large" };
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const key = processedKey();
    const { publicUrl } = await uploadToR2(merged, key, contentType, "processed");
    return { rehostedUrl: publicUrl, rehostedKey: key };
  } catch (err) {
    return { skipped: true, reason: `upload_failed:${(err as Error).message ?? "unknown"}` };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && pnpm exec vitest run lib/scrape/rehost-image.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Wire rehost into cheerio.ts**

Modify `client/lib/scrape/cheerio.ts` — at the end of `scrapeProductUrl`, replace the final `return { ... }` block with:

```ts
  let finalImageUrl: string | undefined;
  if (imageRaw) {
    const absolute = resolveAbsolute(url, imageRaw);
    const rehost = await fetchAndRehostImage(absolute);
    finalImageUrl = "rehostedUrl" in rehost ? rehost.rehostedUrl : absolute;
  }

  return {
    productName: productName || "Untitled product",
    productDesc,
    productImageUrl: finalImageUrl,
    brand: ld?.brand ? sanitize(ld.brand, 80) : undefined,
    price: ld?.price,
  };
```

Add the import at the top:

```ts
import { fetchAndRehostImage } from "./rehost-image";
```

- [ ] **Step 6: Run all scrape tests**

Run: `cd client && pnpm exec vitest run lib/scrape/`
Expected: all green. Existing cheerio tests should still pass — when R2 isn't configured (test env), `fetchAndRehostImage` returns `skipped` and we fall back to the original URL.

- [ ] **Step 7: Commit**

```bash
git add client/lib/scrape/rehost-image.ts client/lib/scrape/rehost-image.test.ts client/lib/scrape/cheerio.ts
git commit -m "feat(scrape): R2 image re-hosting (skips cleanly when R2 not configured)"
```

---

## Task 10: Groq Vision client

**Files:**
- Create: `client/lib/groq/vision.ts`
- Create: `client/lib/groq/vision.test.ts`
- Modify: `client/.env.example` — document `GROQ_VISION_MODEL`

- [ ] **Step 1: Write the failing test**

Create `client/lib/groq/vision.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const create = vi.fn();
class GroqMock {
  chat = { completions: { create } };
  constructor(_: unknown) {}
}
vi.mock("groq-sdk", () => ({ default: GroqMock }));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { GROQ_API_KEY: "gsk_test", GROQ_VISION_MODEL: undefined },
  requireServerEnv: () => "gsk_test",
}));

afterEach(() => {
  create.mockReset();
  vi.restoreAllMocks();
});

import { describeProductImage, VisionError } from "./vision";

describe("describeProductImage", () => {
  it("returns the parsed JSON on the first try", async () => {
    create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Festival Saree",
              description: "Hand-woven cotton",
              category: "fashion",
            }),
          },
        },
      ],
    });
    const r = await describeProductImage(
      "https://assets.adcreator.in/uploads/u/x.png",
    );
    expect(r).toEqual({
      name: "Festival Saree",
      description: "Hand-woven cotton",
      category: "fashion",
    });
    expect(create).toHaveBeenCalledOnce();
  });

  it("retries on bad JSON and succeeds on the second attempt", async () => {
    create
      .mockResolvedValueOnce({
        choices: [{ message: { content: "not json" } }],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "X",
                description: "desc",
                category: "home",
              }),
            },
          },
        ],
      });
    const r = await describeProductImage("https://x.png");
    expect(r.name).toBe("X");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("throws VisionError after 3 strikes", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: "still not json" } }],
    });
    await expect(describeProductImage("https://x.png")).rejects.toBeInstanceOf(
      VisionError,
    );
    expect(create).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec vitest run lib/groq/vision.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `client/lib/groq/vision.ts`:

```ts
/**
 * Groq Vision wrapper — describe a product photo as JSON.
 *
 * Retries up to 3× with a temperature ramp (0.2 → 0.4 → 0.6) so the first
 * attempt is deterministic and later attempts have more flexibility for
 * awkward images. Validates the JSON against a Zod schema; bad JSON or
 * schema mismatch counts as a failed attempt.
 *
 * Caller maps `VisionError` to a 422 `vision_failed` response which opens
 * the ManualEntryDialog with the image preview pre-filled.
 */
import "server-only";

import { z } from "zod";

import { CATEGORIES } from "@/lib/types";
import { requireServerEnv, serverEnv } from "@/lib/env.server";

const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const VisionResultSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  category: z.enum(CATEGORIES).optional(),
});
export type VisionResult = z.infer<typeof VisionResultSchema>;

export class VisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionError";
  }
}

const PROMPT = `You are a product-image describer for an ad-creation tool.
Identify the product in the image. Return ONLY a JSON object with these keys:
- name: ≤80 chars, English
- description: ≤500 chars, English; mention material, use, audience
- category: one of: ${CATEGORIES.join(", ")}
No prose around the JSON.`;

export async function describeProductImage(
  imageUrl: string,
): Promise<VisionResult> {
  const apiKey = requireServerEnv("GROQ_API_KEY");
  const model = serverEnv.GROQ_VISION_MODEL ?? DEFAULT_MODEL;

  const { default: Groq } = await import("groq-sdk");
  const client = new Groq({ apiKey });

  const temperatures = [0.2, 0.4, 0.6];
  let lastError = "no attempts";

  for (let i = 0; i < temperatures.length; i++) {
    try {
      const res = await client.chat.completions.create({
        model,
        temperature: temperatures[i],
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      });
      const content = res.choices[0]?.message?.content ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        lastError = `json_parse:${(err as Error).message}`;
        continue;
      }
      const result = VisionResultSchema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = `schema:${result.error.issues[0]?.message ?? "invalid"}`;
    } catch (err) {
      lastError = `api:${(err as Error).message}`;
    }
  }
  throw new VisionError(`vision_failed_after_${temperatures.length}_attempts:${lastError}`);
}
```

- [ ] **Step 4: Add `GROQ_VISION_MODEL` to env.server.ts**

Modify `client/lib/env.server.ts`. Find the `GROQ_API_KEY:` line and add right after it:

```ts
  GROQ_VISION_MODEL: z.string().min(1).optional(),
```

- [ ] **Step 5: Document the env var**

Modify `client/.env.example`. Find the `# AI providers` block and replace with:

```
# AI providers
GROQ_API_KEY=""
# Optional — pin a specific Groq vision model. Default in code:
# meta-llama/llama-4-scout-17b-16e-instruct
GROQ_VISION_MODEL=""
HUGGINGFACE_TOKEN=""
```

- [ ] **Step 6: Run tests**

Run: `cd client && pnpm exec vitest run lib/groq/vision.test.ts && pnpm typecheck`
Expected: 3 tests green; typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add client/lib/groq/vision.ts client/lib/groq/vision.test.ts \
        client/lib/env.server.ts client/.env.example
git commit -m "feat(groq): vision wrapper — JSON product description with 3-strike retry"
```

---

## Task 11: Photo path in /api/generate/extract

**Files:**
- Modify: `client/app/api/generate/extract/route.ts`
- Modify: `client/app/api/generate/extract/route.test.ts`

- [ ] **Step 1: Update the test file**

Replace the `it("photo path still returns 501", ...)` block in `client/app/api/generate/extract/route.test.ts` with:

```ts
  it("photo path: returns vision-described product on success", async () => {
    // Mock the vision module — the route has just imported it.
    vi.doMock("@/lib/groq/vision", () => ({
      describeProductImage: vi.fn().mockResolvedValue({
        name: "Festival Saree",
        description: "Hand-woven cotton saree",
        category: "fashion",
      }),
      VisionError: class extends Error {},
    }));
    // Re-import the route AFTER the mock so it picks up the mocked vision.
    const { POST: POST_PHOTO } = await import("./route");
    const res = await POST_PHOTO(
      reqJson({
        inputType: "photo",
        imageKey: "uploads/u1/x.png",
      }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.productName).toBe("Festival Saree");
  });

  it("photo path: maps VisionError to 422 vision_failed", async () => {
    class VisionError extends Error {}
    vi.doMock("@/lib/groq/vision", () => ({
      describeProductImage: vi.fn().mockRejectedValue(new VisionError("vision_failed_after_3")),
      VisionError,
    }));
    const { POST: POST_PHOTO } = await import("./route");
    const res = await POST_PHOTO(
      reqJson({
        inputType: "photo",
        imageKey: "uploads/u1/x.png",
      }) as never,
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("vision_failed");
  });
```

Also at the top of the file, after the existing `vi.mock("@/lib/supabase/server", ...)`, add:

```ts
vi.mock("@/lib/r2/client", () => ({
  publicUrl: (k: string) => `https://assets.adcreator.in/${k}`,
}));
```

- [ ] **Step 2: Replace the photo-path block in the route**

Modify `client/app/api/generate/extract/route.ts`. Replace the photo branch (currently a 501) with:

```ts
  // photo branch — Groq Vision describes the uploaded image.
  try {
    const { publicUrl } = await import("@/lib/r2/client");
    const { describeProductImage, VisionError } = await import(
      "@/lib/groq/vision"
    );
    const imageUrl = publicUrl(parsed.imageKey, "uploads");
    try {
      const v = await describeProductImage(imageUrl);
      return NextResponse.json({
        productName: v.name,
        productDesc: v.description,
        productImageUrl: imageUrl,
        ...(v.category ? { category: v.category } : {}),
      });
    } catch (err) {
      if (err instanceof VisionError) {
        return NextResponse.json(
          { error: "vision_failed", message: err.message },
          { status: 422 },
        );
      }
      throw err;
    }
  } catch (err) {
    // The lazy imports themselves throw if the relevant env keys are absent
    // — surface that cleanly so the UI can fall back to manual entry.
    return NextResponse.json(
      {
        error: "service_unavailable",
        message: err instanceof Error ? err.message : "service unavailable",
      },
      { status: 503 },
    );
  }
```

- [ ] **Step 3: Run tests**

Run: `cd client && pnpm exec vitest run app/api/generate/extract/`
Expected: PASS — all existing tests + 2 new ones green.

- [ ] **Step 4: Commit**

```bash
git add client/app/api/generate/extract/route.ts \
        client/app/api/generate/extract/route.test.ts
git commit -m "feat(extract): photo path — Groq Vision describes uploaded R2 images"
```

---

## Task 12: ManualEntryDialog component

**Files:**
- Modify: `client/lib/schemas/generation.ts` — add `ManualEntrySchema`.
- Create: `client/components/generate/manual-entry-dialog.tsx`

- [ ] **Step 1: Add the manual-entry schema**

Append to `client/lib/schemas/generation.ts`:

```ts
export const ManualEntrySchema = z.object({
  productName: z.string().min(1, "Required").max(200, "Keep it short"),
  productDesc: z.string().min(1, "Required").max(500, "Keep it short"),
  category: z.enum(CATEGORIES).optional(),
});
export type ManualEntryInput = z.infer<typeof ManualEntrySchema>;
```

- [ ] **Step 2: Create the dialog**

Create `client/components/generate/manual-entry-dialog.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ManualEntrySchema,
  type ManualEntryInput,
  type ExtractResponse,
} from "@/lib/schemas/generation";
import { CATEGORIES } from "@/lib/types";

export type ManualEntryHint = {
  source: "url" | "photo" | "user";
  urlIfAny?: string;
  imageUrlIfAny?: string;
  defaultName?: string;
  defaultDesc?: string;
};

const SOURCE_HEADLINES: Record<ManualEntryHint["source"], string> = {
  url: "We couldn't read this page",
  photo: "We couldn't recognise the photo",
  user: "Tell us about the product",
};

const SOURCE_DESCRIPTIONS: Record<ManualEntryHint["source"], string> = {
  url: "The site might require a login or ship its product info in a way our scraper can't read. Type the basics below — we'll take it from there.",
  photo: "Our vision model couldn't classify the image. Type the basics below.",
  user: "Type a name and short description so we can write the copy.",
};

export interface ManualEntryDialogProps {
  open: boolean;
  hint: ManualEntryHint | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (extracted: ExtractResponse) => void;
}

export function ManualEntryDialog({
  open,
  hint,
  onOpenChange,
  onSubmit,
}: ManualEntryDialogProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(ManualEntrySchema),
    defaultValues: { productName: "", productDesc: "", category: undefined },
  });

  // Reset whenever the hint changes — pre-fill from any signals we have.
  useEffect(() => {
    if (open && hint) {
      reset({
        productName: hint.defaultName ?? "",
        productDesc: hint.defaultDesc ?? "",
        category: undefined,
      });
    }
  }, [open, hint, reset]);

  const submit = (values: ManualEntryInput) => {
    startTransition(() => {
      const extracted: ExtractResponse = {
        productName: values.productName,
        productDesc: values.productDesc,
        productImageUrl: hint?.imageUrlIfAny ?? hint?.urlIfAny ?? "",
        ...(values.category ? { category: values.category } : {}),
      };
      onSubmit(extracted);
      onOpenChange(false);
      reset();
    });
  };

  const source = hint?.source ?? "user";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h3">{SOURCE_HEADLINES[source]}</DialogTitle>
          <DialogDescription>{SOURCE_DESCRIPTIONS[source]}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="manual-name">Product name</Label>
            <Input
              id="manual-name"
              autoComplete="off"
              placeholder="Festival Saree"
              aria-invalid={Boolean(errors.productName)}
              {...register("productName")}
            />
            {errors.productName ? (
              <p className="text-caption text-destructive mt-1">
                {errors.productName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-desc">Short description</Label>
            <Textarea
              id="manual-desc"
              rows={3}
              placeholder="Hand-woven cotton saree, perfect for festival days."
              aria-invalid={Boolean(errors.productDesc)}
              {...register("productDesc")}
            />
            {errors.productDesc ? (
              <p className="text-caption text-destructive mt-1">
                {errors.productDesc.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-cat">Category (optional)</Label>
            <select
              id="manual-cat"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("category")}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Use these details"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd client && pnpm typecheck`
Expected: clean. If `Textarea` isn't already in `components/ui/`, install it:

```bash
cd client && pnpm dlx shadcn@canary add textarea
```

(The component IS already present per earlier `ls`, so this should be a no-op.)

- [ ] **Step 4: Commit**

```bash
git add client/lib/schemas/generation.ts client/components/generate/manual-entry-dialog.tsx
git commit -m "feat(generate): ManualEntryDialog — fallback for failed url/photo extraction"
```

---

## Task 13: Wire ManualEntryDialog + new error codes through the dashboard

**Files:**
- Modify: `client/components/generate/url-pane.tsx` — open dialog on `no_metadata` / `login_wall`.
- Modify: `client/app/(dashboard)/dashboard/dashboard-shell.tsx` — own dialog state.
- Modify: `client/components/generate/input-form.tsx` — add `onRequestManualEntry` prop forwarding.

- [ ] **Step 1: Replace `client/components/generate/url-pane.tsx`**

```tsx
"use client";

import { Globe, X } from "lucide-react";
import { useState } from "react";
import type { InputValue } from "@/components/generate/input-form";
import { isAcceptableProductUrl } from "@/components/generate/input-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExtractResponse } from "@/lib/schemas/generation";

import type { ManualEntryHint } from "./manual-entry-dialog";

export interface UrlPaneProps {
  value: InputValue;
  onChange: (v: InputValue) => void;
  onProductExtracted?: (product: ExtractResponse) => void;
  onRequestManualEntry?: (hint: ManualEntryHint) => void;
}

type ExtractState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

const FALLBACK_CODES = new Set(["no_metadata", "login_wall", "vision_failed"]);

export function UrlPane({
  value,
  onChange,
  onProductExtracted,
  onRequestManualEntry,
}: UrlPaneProps) {
  const [draft, setDraft] = useState(value.type === "url" ? value.url : "");
  const [error, setError] = useState<string | null>(null);
  const [extractState, setExtractState] = useState<ExtractState>({ status: "idle" });

  if (value.type === "url") {
    const product = (onProductExtracted as unknown) as
      | ExtractResponse
      | undefined;
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted border border-border flex items-center justify-center">
          <Globe className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium truncate">{value.url}</p>
          <p className="text-caption mt-0.5">Product URL</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear URL"
          onClick={() => {
            setDraft("");
            setExtractState({ status: "idle" });
            onChange({ type: "empty" });
          }}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    const validationError = isAcceptableProductUrl(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setExtractState({ status: "loading" });

    try {
      const res = await fetch("/api/generate/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType: "url", inputUrl: trimmed }),
      });

      if (res.ok) {
        const product = (await res.json()) as ExtractResponse;
        onProductExtracted?.(product);
        onChange({ type: "url", url: trimmed });
        setExtractState({ status: "idle" });
        return;
      }
      const body = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (body?.error && FALLBACK_CODES.has(body.error)) {
        // Open the manual-entry dialog with a useful prefill / hint.
        onRequestManualEntry?.({ source: "url", urlIfAny: trimmed });
        setExtractState({ status: "idle" });
        return;
      }

      const msg =
        body?.message ??
        "Could not extract product details from this URL. Try uploading a photo instead.";
      setExtractState({ status: "error", message: msg });
    } catch {
      setExtractState({
        status: "error",
        message: "Network error — check your connection and try again.",
      });
    }
  };

  const isLoading = extractState.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/product"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
            if (extractState.status === "error") setExtractState({ status: "idle" });
          }}
          disabled={isLoading}
          aria-label="Product URL"
          aria-invalid={
            error || extractState.status === "error" ? "true" : undefined
          }
          aria-describedby={
            error || extractState.status === "error" ? "url-error" : undefined
          }
          className="flex-1"
        />
        <Button type="submit" size="default" disabled={isLoading}>
          {isLoading ? "Extracting…" : "Use URL"}
        </Button>
      </div>

      {error ? (
        <p id="url-error" className="text-caption text-destructive" role="alert">
          {error}
        </p>
      ) : extractState.status === "error" ? (
        <p id="url-error" className="text-caption text-destructive" role="alert">
          {extractState.message}
        </p>
      ) : (
        <p className="text-caption">
          We'll extract product details automatically.{" "}
          <button
            type="button"
            className="underline-offset-2 hover:underline text-foreground"
            onClick={() => onRequestManualEntry?.({ source: "user" })}
          >
            Enter details manually
          </button>
          .
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Update InputForm to forward the prop**

Modify the `InputForm` export at the bottom of `client/components/generate/input-form.tsx`:

```tsx
export function InputForm({
  value,
  onChange,
  onProductExtracted,
  onRequestManualEntry,
  className,
}: InputFormProps) {
  return (
    <Tabs defaultValue="upload" className={cn("w-full", className)}>
      <TabsList className="w-full">
        <TabsTrigger value="upload" className="flex-1 gap-1.5">
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Upload
        </TabsTrigger>
        <TabsTrigger value="url" className="flex-1 gap-1.5">
          <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
          URL
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <UploadPane value={value} onChange={onChange} />
      </TabsContent>

      <TabsContent value="url" className="mt-4">
        <UrlPane
          value={value}
          onChange={onChange}
          onProductExtracted={onProductExtracted}
          onRequestManualEntry={onRequestManualEntry}
        />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Wire dashboard-shell**

Replace `client/app/(dashboard)/dashboard/dashboard-shell.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";

import { InputForm, type InputValue } from "@/components/generate/input-form";
import { ManualEntryDialog, type ManualEntryHint } from "@/components/generate/manual-entry-dialog";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { TEMPLATES } from "@/lib/templates/registry";

import { CanvasPreview } from "./canvas-preview";
import { Step } from "./step";

export function DashboardShell() {
  const [inputValue, setInputValue] = useState<InputValue>({ type: "empty" });
  const [extractedProduct, setExtractedProduct] = useState<ExtractResponse | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualHint, setManualHint] = useState<ManualEntryHint | null>(null);

  useEffect(() => {
    if (inputValue.type === "file") {
      setExtractedProduct({
        productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
        productDesc: `${(inputValue.file.size / 1024).toFixed(0)} KB · ${inputValue.file.type}`,
        productImageUrl: inputValue.previewUrl,
      });
    } else if (inputValue.type === "uploaded") {
      let cancelled = false;
      (async () => {
        const res = await fetch("/api/generate/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: "photo",
            imageKey: inputValue.key,
          }),
        });
        if (cancelled) return;
        if (res.ok) {
          const product = (await res.json()) as ExtractResponse;
          setExtractedProduct(product);
        } else {
          // Open manual entry with the upload preview as the image
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          if (body?.error === "vision_failed") {
            setManualHint({
              source: "photo",
              imageUrlIfAny: inputValue.publicUrl,
            });
            setManualOpen(true);
          }
          setExtractedProduct({
            productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
            productDesc: `Uploaded · ${(inputValue.file.size / 1024).toFixed(0)} KB`,
            productImageUrl: inputValue.publicUrl,
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    } else if (inputValue.type === "empty") {
      setExtractedProduct(null);
    }
  }, [inputValue]);

  return (
    <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
      <div className="space-y-6">
        <Step n="01" title="Product" body="Upload an image or paste a product URL">
          <InputForm
            value={inputValue}
            onChange={setInputValue}
            onProductExtracted={setExtractedProduct}
            onRequestManualEntry={(hint) => {
              setManualHint(hint);
              setManualOpen(true);
            }}
          />
        </Step>
        <Step n="02" title="Language & tone" body="Native script, never translated">
          <p className="text-caption">Picker lives inside the preview card →</p>
        </Step>
        <Step n="03" title="Template" body="Pick a starting point — switch anytime">
          <p className="text-caption">Selector lives inside the preview card →</p>
        </Step>
      </div>

      <div>
        <div className="sticky top-20">
          <CanvasPreview
            templates={TEMPLATES}
            defaultTemplateId={TEMPLATES[0]?.id ?? ""}
            extractedProduct={extractedProduct}
          />
        </div>
      </div>

      <ManualEntryDialog
        open={manualOpen}
        hint={manualHint}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) setManualHint(null);
        }}
        onSubmit={(product) => setExtractedProduct(product)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck + lint + tests**

Run:

```bash
cd client && pnpm typecheck && pnpm lint && pnpm test
```

Expected: all green.

- [ ] **Step 5: Commit (Phase C checkpoint)**

```bash
git add client/components/generate/url-pane.tsx \
        client/components/generate/input-form.tsx \
        client/app/\(dashboard\)/dashboard/dashboard-shell.tsx
git commit -m "feat(generate): wire ManualEntryDialog + fallback hooks in dashboard shell"
```

---

## Task 14: e2e + tick TODO

**Files:**
- Create: `client/e2e/extraction-flow.spec.ts`
- Modify: `TODO.md` — tick relevant §4–§6 items.

- [ ] **Step 1: Write the e2e**

Create `client/e2e/extraction-flow.spec.ts`:

```ts
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
      // Either the URL pane shows the success state OR the manual-entry dialog opens.
      await expect.poll(async () => {
        const urlSet = await page.getByText(/Product URL/).isVisible();
        const manual = await page
          .getByRole("dialog")
          .getByText(/Tell us about|We couldn't read/)
          .isVisible()
          .catch(() => false);
        return urlSet || manual;
      }).toBeTruthy();
    });

    test("private-IP URL is rejected client-side before the API call", async ({ page }) => {
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
```

- [ ] **Step 2: Tick TODO §4 + §5 + §6 items**

Modify `TODO.md`. In §4.1 (replace the four lines):

```
- [x] `adcreator-uploads` — raw user uploads. **Private**. PUT via presigned URL only.
- [x] `adcreator-processed` — BG-removed transparent PNGs + rehosted og:image. **Private**. Read via presigned GET URL OR served via the public CDN domain.
- [ ] `adcreator-public` — template previews, watermark assets, branding. **Public read** via Cloudflare CDN. (Bucket name configured; will populate during template seed.)
- [x] Decision: For MVP, route `adcreator-processed` through the same public CDN domain because the URLs are unguessable (`bgr-{uuid}.png`); risk documented in security notes.
```

In §4.4 (replace):

```
- [x] `S3Client` with `region: 'auto'`, lazily constructed via `getR2Client()`.
- [x] Helpers: `uploadToR2`, `presignPut`, `publicUrl`, `isR2Configured` (inert-when-no-keys gate).
- [x] Key conventions in `lib/r2/keys.ts`: `uploads/{userId}/{uuid}.{ext}`, `processed/bgr-{uuid}.png`, `exports/{userId}/{generationId}.png`.
```

In §5.1 (replace):

```
- [x] `/api/upload/presign` — Zod-validated body, contentType allowlist (jpeg/png/webp), 10 MB cap. Returns `{ presignedUrl, key, publicUrl }` or 503 `r2_not_configured` when keys absent.
```

In §5.2 (replace):

```
- [x] Drag-and-drop zone + file picker (UploadPane). Progress bar via XHR.
- [ ] Client-side preflight: image dimensions ≥ 400×400, ≤ 4096×4096 (warn, don't block). _Pending — current preflight is type + size only._
- [x] Show progress bar during PUT; retry policy: one retry on network failure (built into XHR error handler).
- [x] On 200 from R2, automatically fires `POST /api/generate/extract` with `{inputType: photo, imageKey}`.
```

In §6.1 (replace):

```
- [x] HTTPS-only + IP-literal block + DNS-resolve guard (rejects hostnames whose A/AAAA resolves to RFC1918, link-local, loopback, CGNAT, cloud metadata).
- [x] Fetch with 5s timeout, polite UA, 2 MB streaming cap, content-type gate.
- [x] Parse: JSON-LD Product schema FIRST; OG / `<title>` / `<meta>` / `<h1>` fallback. Sanitised via isomorphic-dompurify; whitespace collapsed; truncated.
- [x] og:image fetched and re-uploaded to R2 `processed` bucket (skips cleanly when R2 not configured).
```

In §6.2 (replace):

```
- [x] Groq Vision via `lib/groq/vision.ts`. Default model: `meta-llama/llama-4-scout-17b-16e-instruct`; override via `GROQ_VISION_MODEL` env.
- [x] Prompt → strict JSON `{name, description, category}`; Zod-validated; 3-strike retry with temperature ramp.
- [x] Fallback: `<ManualEntryDialog>` opens on `vision_failed` with the upload preview as the image.
```

In §6.3 (replace):

```
- [x] No metadata → manual-entry dialog opens with the URL pre-filled (source: "url").
- [x] Non-HTML content-type → 422 `fetch_failed`.
- [x] Marketplace login walls — `isLoginWall` heuristic detects noindex+suspicious-title and login redirect paths; surfaces 422 `login_wall` → manual-entry dialog.
- [x] Adult/restricted keyword blocklist → 422 `restricted_content` (toast, no manual-entry fallback — abuse mitigation).
```

- [ ] **Step 3: Final verification**

Run:

```bash
cd client && pnpm typecheck && pnpm lint && pnpm test
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add client/e2e/extraction-flow.spec.ts TODO.md
git commit -m "test(extract): playwright extraction flow + tick TODO §4–§6"
```

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task |
|---|---|
| DNS-resolve SSRF guard | Task 1 |
| JSON-LD Product schema | Task 2 |
| Adult/restricted blocklist | Task 3 |
| Login-wall detection | Task 4 |
| DOMPurify sanitization, integration, new error codes | Task 5 |
| `lib/r2/client.ts` helpers + `isR2Configured` | Task 6 |
| `/api/upload/presign` route | Task 7 |
| UploadPane → presign + PUT + photo-extract trigger | Task 8 |
| Image re-hosting (`fetchAndRehostImage`) + cheerio integration | Task 9 |
| Groq Vision wrapper + 3-strike retry + GROQ_VISION_MODEL env | Task 10 |
| Photo branch in /api/generate/extract | Task 11 |
| `<ManualEntryDialog>` + `ManualEntrySchema` | Task 12 |
| Wire dialog through UrlPane + dashboard-shell | Task 13 |
| Playwright e2e + TODO ticks | Task 14 |

All spec sections covered.

**2. Placeholder scan:** Plan has been scanned for "TBD" / "implement later" / "similar to" / "Add error handling". None present.

**3. Type consistency:** `ScrapeError` codes consistent across cheerio.ts (Task 5), route.ts (Tasks 5 + 11), url-pane.tsx (Task 13). `InputValue` union extended in Task 8 and consumed in Task 13. `ExtractResponse` extended in Task 5 with `brand`, `price` and consumed in Tasks 8/12/13. `ManualEntryHint` defined in Task 12 and consumed in Task 13.

No issues found in self-review.
