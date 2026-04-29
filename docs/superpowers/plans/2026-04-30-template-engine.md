# Template engine — Fabric.js + font proxy + first templates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Fabric.js client-side rendering, the font CORS proxy, and three real template configs so the dashboard preview area renders an actual ad and the marketing `/templates` page shows real previews. No external creds needed — fully self-contained.

**Architecture:**
- Templates are typed JSON configs (`TemplateConfig`) registered in `lib/templates/`. The same registry feeds the `/api/templates` route, the marketing gallery, and the dashboard selector.
- Fabric.js renders client-side only (Next.js needs `dynamic({ ssr: false })`). The font CORS taint is solved by proxying Google Fonts CSS + `.woff2` through our own routes (`/api/fonts/[family]`, `/api/fontfile/[...path]`).
- We TDD the data + utility code (template lookup, CSS URL rewriting, API response shapes). Canvas rendering itself gets a Playwright snapshot in a later round — out of scope here.

**Tech Stack:** Fabric.js v5 (dynamic-imported), Next.js 16 Route Handlers, vitest + jsdom, react-hook-form (later), Tailwind v4 tokens.

**Spec section:** TODO §11 (Template Engine), parts of §6 (URL extraction inputs), §13 (font routes inventory).

---

## File structure

| Action | Path | Responsibility |
|---|---|---|
| Modify | `client/package.json` | Add `fabric@^5.4.0`, `@types/fabric`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` |
| Create | `client/vitest.config.ts` | Vitest config, jsdom env, path alias `@/*` |
| Create | `client/vitest.setup.ts` | jest-dom matchers |
| Create | `client/lib/fonts/proxy.ts` | `rewriteFontCss(css, base)` pure function |
| Create | `client/lib/fonts/proxy.test.ts` | Tests for the rewriter |
| Create | `client/lib/fonts/families.ts` | `FONT_FAMILY_MAP: Record<Language, GoogleFontDescriptor>` |
| Create | `client/app/api/fonts/[family]/route.ts` | Fetch Google CSS, rewrite urls, return with CORS |
| Create | `client/app/api/fontfile/[...path]/route.ts` | Proxy `.woff2` binaries with CORS + 1y cache |
| Create | `client/lib/templates/configs/festival-bright-1x1.ts` | First real template — saffron/black, square |
| Create | `client/lib/templates/configs/clean-minimal-1x1.ts` | Restrained, white-text-on-card |
| Create | `client/lib/templates/configs/urgency-red-1x1.ts` | Bold red CTA-led template |
| Create | `client/lib/templates/configs/index.ts` | Barrel export |
| Modify | `client/lib/templates/registry.ts` | Import configs, expose `TEMPLATES`, `getTemplate(id)`, `filterTemplates({format,category})` |
| Create | `client/lib/templates/registry.test.ts` | TDD: lookup, filter, no-duplicate-id invariant |
| Create | `client/app/api/templates/route.ts` | GET, optional `?format=&category=` filters, returns sanitised list |
| Create | `client/app/api/templates/route.test.ts` | TDD: response shape, filtering, public access |
| Create | `client/components/canvas/load-font.ts` | `loadFontFace(family, weight, url)` via FontFace API |
| Create | `client/components/canvas/FabricCanvas.tsx` | Client component. Dynamic-imports fabric. Renders template + product image + copy + watermark. |
| Create | `client/components/canvas/TemplateSelector.tsx` | Grid of template thumbnails, selected state, `onSelect` callback |
| Modify | `client/app/(dashboard)/dashboard/page.tsx` | Replace placeholder preview with real `<FabricCanvas>` + template selector |
| Modify | `client/app/(marketing)/templates/page.tsx` | Replace placeholder grid with real `<FabricCanvas>` thumbnails |
| Modify | `client/package.json` | Add scripts: `test`, `test:watch`, `test:coverage` |

---

## Task 1 — Vitest scaffolding

**Files:**
- Modify: `client/package.json`
- Create: `client/vitest.config.ts`
- Create: `client/vitest.setup.ts`

- [ ] **Step 1.1: Install test deps**

```bash
cd client && pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @types/jsdom
```

- [ ] **Step 1.2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "playwright-report"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "app/**", "components/**"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.stories.tsx", "components/ui/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 1.3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 1.4: Add scripts to `package.json`** (under `"scripts"`):

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 1.5: Smoke test**

```bash
cd client && pnpm test
```

Expected: `No test files found, exiting with code 0` (we haven't written tests yet, but vitest runs).

- [ ] **Step 1.6: Commit**

```bash
git add client/package.json client/pnpm-lock.yaml client/vitest.config.ts client/vitest.setup.ts
git commit -m "chore: scaffold vitest + jsdom + testing-library"
```

---

## Task 2 — Font CSS rewriter (pure utility, TDD)

**Files:**
- Create: `client/lib/fonts/proxy.ts`
- Create: `client/lib/fonts/proxy.test.ts`

- [ ] **Step 2.1: Write failing tests**

```ts
// client/lib/fonts/proxy.test.ts
import { describe, expect, it } from "vitest";
import { rewriteFontCss } from "./proxy";

describe("rewriteFontCss", () => {
  it("rewrites a single gstatic url to a proxied one", () => {
    const input = `@font-face { src: url(https://fonts.gstatic.com/s/notosans/v30/file.woff2) format("woff2"); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toContain("/api/fontfile/s%2Fnotosans%2Fv30%2Ffile.woff2");
    expect(out).not.toContain("fonts.gstatic.com");
  });

  it("rewrites multiple urls in one block", () => {
    const input = `
      @font-face { src: url(https://fonts.gstatic.com/s/a.woff2); }
      @font-face { src: url(https://fonts.gstatic.com/s/b.woff2); }
    `;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out.match(/\/api\/fontfile\//g)).toHaveLength(2);
  });

  it("leaves non-gstatic urls alone", () => {
    const input = `@font-face { src: url(https://example.com/font.woff2); }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toBe(input);
  });

  it("preserves the rest of the rule", () => {
    const input = `@font-face { font-family: "Noto Sans"; src: url(https://fonts.gstatic.com/x.woff2) format("woff2"); font-weight: 400; }`;
    const out = rewriteFontCss(input, "/api/fontfile");
    expect(out).toContain('font-family: "Noto Sans"');
    expect(out).toContain("font-weight: 400");
    expect(out).toContain('format("woff2")');
  });
});
```

- [ ] **Step 2.2: Run tests, verify they fail**

```bash
cd client && pnpm test lib/fonts/proxy.test.ts
```

Expected: FAIL with "Cannot find module './proxy'"

- [ ] **Step 2.3: Implement `rewriteFontCss`**

```ts
// client/lib/fonts/proxy.ts
/**
 * Rewrites every `https://fonts.gstatic.com/<path>` URL in a Google Fonts
 * CSS payload to `<base>/<encodeURIComponent(path)>` so the browser fetches
 * the .woff2 from our domain (avoids CORS taint on the Fabric canvas — see
 * spec §11).
 */
const GSTATIC_URL = /url\(\s*https:\/\/fonts\.gstatic\.com\/([^)]+?)\s*\)/g;

export function rewriteFontCss(css: string, base: string): string {
  return css.replace(GSTATIC_URL, (_match, path: string) => {
    return `url(${base}/${encodeURIComponent(path)})`;
  });
}
```

- [ ] **Step 2.4: Run tests, verify they pass**

```bash
cd client && pnpm test lib/fonts/proxy.test.ts
```

Expected: PASS, 4/4.

- [ ] **Step 2.5: Commit**

```bash
git add client/lib/fonts/
git commit -m "feat(fonts): css url rewriter for canvas-safe font proxy"
```

---

## Task 3 — Font family map

**Files:**
- Create: `client/lib/fonts/families.ts`

- [ ] **Step 3.1: Define the family map**

```ts
// client/lib/fonts/families.ts
import type { Language } from "@/lib/types";

export interface GoogleFontDescriptor {
  /** key used in the URL: /api/fonts/[family] */
  slug: string;
  /** css font-family value Fabric will use */
  cssName: string;
  /** Google fonts query string after `family=` */
  googleQuery: string;
}

/** Languages → Noto family. Used by both the canvas renderer and the font
 *  proxy route. The key matches `Language` so we never hardcode strings. */
export const FONT_FAMILIES: Record<Language, GoogleFontDescriptor> = {
  en: {
    slug: "noto-sans",
    cssName: "Noto Sans",
    googleQuery: "Noto+Sans:wght@400;500;700",
  },
  hi: {
    slug: "noto-sans-devanagari",
    cssName: "Noto Sans Devanagari",
    googleQuery: "Noto+Sans+Devanagari:wght@400;500;700",
  },
  ta: {
    slug: "noto-sans-tamil",
    cssName: "Noto Sans Tamil",
    googleQuery: "Noto+Sans+Tamil:wght@400;500;700",
  },
  te: {
    slug: "noto-sans-telugu",
    cssName: "Noto Sans Telugu",
    googleQuery: "Noto+Sans+Telugu:wght@400;500;700",
  },
};

/** Reverse lookup by slug for the route handler. */
export function findFamilyBySlug(slug: string): GoogleFontDescriptor | undefined {
  return Object.values(FONT_FAMILIES).find((f) => f.slug === slug);
}
```

- [ ] **Step 3.2: Commit**

```bash
git add client/lib/fonts/families.ts
git commit -m "feat(fonts): language → Noto family descriptor map"
```

---

## Task 4 — Font CSS proxy route

**Files:**
- Create: `client/app/api/fonts/[family]/route.ts`

- [ ] **Step 4.1: Implement the route**

```ts
// client/app/api/fonts/[family]/route.ts
import { findFamilyBySlug } from "@/lib/fonts/families";
import { rewriteFontCss } from "@/lib/fonts/proxy";

export const runtime = "nodejs";
export const revalidate = 86400; // 1 day

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ family: string }> },
) {
  const { family } = await params;
  const desc = findFamilyBySlug(family);
  if (!desc) {
    return new Response("Not found", { status: 404 });
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=${desc.googleQuery}&display=swap`;
  const cssRes = await fetch(cssUrl, {
    headers: {
      // Google Fonts returns different CSS for different UAs; force the
      // modern one with the .woff2 urls.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    next: { revalidate: 86400 },
  });
  if (!cssRes.ok) {
    return new Response("Upstream font CSS fetch failed", {
      status: 502,
    });
  }
  const css = await cssRes.text();
  const rewritten = rewriteFontCss(css, "/api/fontfile");

  return new Response(rewritten, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

- [ ] **Step 4.2: Smoke test (dev server)**

```bash
cd client && pnpm dev &
sleep 4
curl -sI http://localhost:3000/api/fonts/noto-sans-devanagari | head -8
kill %1
```

Expected: `HTTP/1.1 200 OK`, `Content-Type: text/css`. Body (omit `-I`) contains `/api/fontfile/`.

- [ ] **Step 4.3: Commit**

```bash
git add client/app/api/fonts/
git commit -m "feat(fonts): proxy google fonts css with cors-safe urls"
```

---

## Task 5 — Font binary proxy route

**Files:**
- Create: `client/app/api/fontfile/[...path]/route.ts`

- [ ] **Step 5.1: Implement the route**

```ts
// client/app/api/fontfile/[...path]/route.ts
export const runtime = "nodejs";
export const revalidate = 31536000; // 1 year

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const decoded = path.map((p) => decodeURIComponent(p)).join("/");
  // SSRF guard — only allow gstatic paths, never arbitrary fetches
  if (decoded.includes("..") || decoded.startsWith("/")) {
    return new Response("Bad path", { status: 400 });
  }

  const upstream = `https://fonts.gstatic.com/${decoded}`;
  const res = await fetch(upstream, { next: { revalidate: 31536000 } });
  if (!res.ok) {
    return new Response("Upstream font fetch failed", { status: 502 });
  }
  const buf = await res.arrayBuffer();

  return new Response(buf, {
    headers: {
      "Content-Type": "font/woff2",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

- [ ] **Step 5.2: Commit**

```bash
git add client/app/api/fontfile/
git commit -m "feat(fonts): binary woff2 proxy with 1y immutable cache"
```

---

## Task 6 — Three real template configs

**Files:**
- Create: `client/lib/templates/configs/festival-bright-1x1.ts`
- Create: `client/lib/templates/configs/clean-minimal-1x1.ts`
- Create: `client/lib/templates/configs/urgency-red-1x1.ts`
- Create: `client/lib/templates/configs/index.ts`

- [ ] **Step 6.1: festival-bright-1x1**

```ts
// client/lib/templates/configs/festival-bright-1x1.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const festivalBright1x1: TemplateConfig = {
  id: "festival_bright_01_1x1",
  format: "1x1",
  category: "sale",
  canvas: { width: 1080, height: 1080, background: "#FF6B35" },
  layers: [
    { type: "rect", x: 0, y: 800, w: 1080, h: 280, fill: "#111111" },
    { type: "product", x: 60, y: 80, w: 520, h: 700, shadow: true },
    {
      type: "text",
      key: "headline",
      x: 620,
      y: 120,
      maxWidth: 420,
      fontSize: 56,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
    },
    {
      type: "text",
      key: "subheadline",
      x: 620,
      y: 320,
      maxWidth: 420,
      fontSize: 28,
      fontFamily: "Noto Sans",
      fill: "#f5e9d8",
      fontWeight: "400",
    },
    {
      type: "cta_btn",
      x: 620,
      y: 880,
      w: 360,
      h: 84,
      fill: "#ffffff",
      textFill: "#111111",
      rx: 12,
    },
    {
      type: "text",
      key: "cta",
      x: 800,
      y: 922,
      maxWidth: 360,
      fontSize: 28,
      fontFamily: "Noto Sans",
      fill: "#111111",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
```

- [ ] **Step 6.2: clean-minimal-1x1**

```ts
// client/lib/templates/configs/clean-minimal-1x1.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const cleanMinimal1x1: TemplateConfig = {
  id: "clean_minimal_01_1x1",
  format: "1x1",
  category: "showcase",
  canvas: { width: 1080, height: 1080, background: "#0F0F12" },
  layers: [
    { type: "product", x: 240, y: 80, w: 600, h: 600 },
    {
      type: "text",
      key: "headline",
      x: 80,
      y: 760,
      maxWidth: 920,
      fontSize: 64,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "500",
      textAlign: "center",
    },
    {
      type: "text",
      key: "subheadline",
      x: 80,
      y: 880,
      maxWidth: 920,
      fontSize: 26,
      fontFamily: "Noto Sans",
      fill: "#a1a1aa",
      fontWeight: "400",
      textAlign: "center",
    },
    {
      type: "cta_btn",
      x: 380,
      y: 960,
      w: 320,
      h: 80,
      fill: "#ffffff",
      textFill: "#0F0F12",
      rx: 999,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1000,
      maxWidth: 320,
      fontSize: 24,
      fontFamily: "Noto Sans",
      fill: "#0F0F12",
      fontWeight: "500",
      textAlign: "center",
    },
  ],
};
```

- [ ] **Step 6.3: urgency-red-1x1**

```ts
// client/lib/templates/configs/urgency-red-1x1.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const urgencyRed1x1: TemplateConfig = {
  id: "urgency_red_01_1x1",
  format: "1x1",
  category: "urgency",
  canvas: { width: 1080, height: 1080, background: "#C81D25" },
  layers: [
    {
      type: "text",
      key: "headline",
      x: 80,
      y: 80,
      maxWidth: 920,
      fontSize: 96,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
    },
    { type: "product", x: 200, y: 380, w: 680, h: 460, shadow: true },
    {
      type: "text",
      key: "subheadline",
      x: 80,
      y: 880,
      maxWidth: 920,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "#fde2e4",
      fontWeight: "400",
    },
    {
      type: "cta_btn",
      x: 80,
      y: 970,
      w: 920,
      h: 80,
      fill: "#111111",
      textFill: "#ffffff",
      rx: 16,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1010,
      maxWidth: 920,
      fontSize: 28,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
```

- [ ] **Step 6.4: Barrel export**

```ts
// client/lib/templates/configs/index.ts
import { cleanMinimal1x1 } from "./clean-minimal-1x1";
import { festivalBright1x1 } from "./festival-bright-1x1";
import { urgencyRed1x1 } from "./urgency-red-1x1";

export const ALL_TEMPLATES = [
  festivalBright1x1,
  cleanMinimal1x1,
  urgencyRed1x1,
];
```

- [ ] **Step 6.5: Commit**

```bash
git add client/lib/templates/configs/
git commit -m "feat(templates): three real fabric template configs (1x1)"
```

---

## Task 7 — Template registry (TDD)

**Files:**
- Modify: `client/lib/templates/registry.ts`
- Create: `client/lib/templates/registry.test.ts`

- [ ] **Step 7.1: Write failing tests**

```ts
// client/lib/templates/registry.test.ts
import { describe, expect, it } from "vitest";
import {
  TEMPLATES,
  filterTemplates,
  getTemplate,
} from "./registry";

describe("template registry", () => {
  it("loads all configs", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it("template ids are unique", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTemplate returns by id", () => {
    const t = getTemplate("festival_bright_01_1x1");
    expect(t).toBeDefined();
    expect(t?.format).toBe("1x1");
    expect(t?.category).toBe("sale");
  });

  it("getTemplate returns undefined for unknown id", () => {
    expect(getTemplate("does-not-exist")).toBeUndefined();
  });

  it("filterTemplates by format", () => {
    const out = filterTemplates({ format: "1x1" });
    expect(out.every((t) => t.format === "1x1")).toBe(true);
  });

  it("filterTemplates by category", () => {
    const out = filterTemplates({ category: "sale" });
    expect(out.every((t) => t.category === "sale")).toBe(true);
  });

  it("filterTemplates with both filters", () => {
    const out = filterTemplates({ format: "1x1", category: "urgency" });
    expect(out.length).toBe(1);
    expect(out[0].id).toBe("urgency_red_01_1x1");
  });
});
```

- [ ] **Step 7.2: Run tests, verify they fail**

```bash
cd client && pnpm test lib/templates/registry.test.ts
```

Expected: FAIL — `filterTemplates is not a function`, `TEMPLATES.length is 0`.

- [ ] **Step 7.3: Implement registry**

```ts
// client/lib/templates/registry.ts
/**
 * Template registry — TODO §11.2.
 *
 * Single source of truth for which templates exist. Imported by:
 *   - GET /api/templates (server)
 *   - <TemplateSelector /> (client)
 *   - the marketing /templates page
 */
import type { Format, TemplateCategory } from "@/lib/types";

import { ALL_TEMPLATES } from "./configs";
import type { TemplateConfig } from "./types";

export const TEMPLATES: TemplateConfig[] = ALL_TEMPLATES;

export function getTemplate(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export interface TemplateFilter {
  format?: Format;
  category?: TemplateCategory;
}

export function filterTemplates(filter: TemplateFilter): TemplateConfig[] {
  return TEMPLATES.filter((t) => {
    if (filter.format && t.format !== filter.format) return false;
    if (filter.category && t.category !== filter.category) return false;
    return true;
  });
}
```

- [ ] **Step 7.4: Run tests, verify they pass**

```bash
cd client && pnpm test lib/templates/registry.test.ts
```

Expected: PASS, 7/7.

- [ ] **Step 7.5: Commit**

```bash
git add client/lib/templates/registry.ts client/lib/templates/registry.test.ts
git commit -m "feat(templates): registry with filter + lookup helpers (TDD)"
```

---

## Task 8 — `/api/templates` route (TDD)

**Files:**
- Create: `client/app/api/templates/route.ts`
- Create: `client/app/api/templates/route.test.ts`

- [ ] **Step 8.1: Write failing tests**

```ts
// client/app/api/templates/route.test.ts
import { describe, expect, it } from "vitest";
import { GET } from "./route";

function req(url: string): Request {
  return new Request(url);
}

describe("GET /api/templates", () => {
  it("returns all templates", async () => {
    const res = await GET(req("http://localhost/api/templates"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.templates)).toBe(true);
    expect(json.templates.length).toBeGreaterThanOrEqual(3);
  });

  it("filters by format", async () => {
    const res = await GET(req("http://localhost/api/templates?format=1x1"));
    const json = await res.json();
    expect(json.templates.every((t: { format: string }) => t.format === "1x1")).toBe(true);
  });

  it("filters by category", async () => {
    const res = await GET(req("http://localhost/api/templates?category=sale"));
    const json = await res.json();
    expect(json.templates.every((t: { category: string }) => t.category === "sale")).toBe(true);
  });

  it("400s on invalid format", async () => {
    const res = await GET(req("http://localhost/api/templates?format=99x99"));
    expect(res.status).toBe(400);
  });

  it("includes id, name (derived), category, format, config", async () => {
    const res = await GET(req("http://localhost/api/templates"));
    const json = await res.json();
    const t = json.templates[0];
    expect(t).toHaveProperty("id");
    expect(t).toHaveProperty("category");
    expect(t).toHaveProperty("format");
    expect(t).toHaveProperty("config");
    expect(t.config).toHaveProperty("canvas");
    expect(t.config).toHaveProperty("layers");
  });
});
```

- [ ] **Step 8.2: Run tests, verify they fail**

```bash
cd client && pnpm test app/api/templates/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 8.3: Implement the route**

```ts
// client/app/api/templates/route.ts
import { z } from "zod";

import { filterTemplates } from "@/lib/templates/registry";
import { FORMATS, TEMPLATE_CATEGORIES } from "@/lib/types";

const QuerySchema = z.object({
  format: z.enum(FORMATS).optional(),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    format: url.searchParams.get("format") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const list = filterTemplates(parsed.data);

  return Response.json(
    {
      templates: list.map((t) => ({
        id: t.id,
        category: t.category,
        format: t.format,
        config: t,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
  );
}
```

- [ ] **Step 8.4: Run tests, verify they pass**

```bash
cd client && pnpm test app/api/templates/route.test.ts
```

Expected: PASS, 5/5.

- [ ] **Step 8.5: Commit**

```bash
git add client/app/api/templates/
git commit -m "feat(api): GET /api/templates with format+category filtering (TDD)"
```

---

## Task 9 — Install Fabric.js

**Files:**
- Modify: `client/package.json`

- [ ] **Step 9.1: Install**

```bash
cd client && pnpm add fabric@^5.4.0 && pnpm add -D @types/fabric
```

- [ ] **Step 9.2: Commit**

```bash
git add client/package.json client/pnpm-lock.yaml
git commit -m "chore: add fabric.js v5 + types"
```

---

## Task 10 — `loadFontFace` helper

**Files:**
- Create: `client/components/canvas/load-font.ts`

- [ ] **Step 10.1: Implement the helper**

```ts
// client/components/canvas/load-font.ts
"use client";

/**
 * Loads a Google Font via the FontFace API by fetching our proxied CSS,
 * extracting the first @font-face src, and registering it with the document.
 * Used by FabricCanvas to ensure the canvas's drawn text uses Devanagari /
 * Tamil / Telugu glyphs without tainting the canvas.
 *
 * Resolves once the font is ready or rejects on network error.
 */
export async function loadProxiedFont(slug: string, family: string): Promise<void> {
  // Bail if already loaded
  if (document.fonts && Array.from(document.fonts).some((f) => f.family === family)) {
    return;
  }

  const cssRes = await fetch(`/api/fonts/${slug}`, { cache: "force-cache" });
  if (!cssRes.ok) throw new Error(`font css fetch failed: ${cssRes.status}`);
  const css = await cssRes.text();

  // Pick the first .woff2 url and weight from the CSS payload
  const blocks = css.split("@font-face");
  for (const block of blocks) {
    const url = block.match(/url\(([^)]+)\)/)?.[1];
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    if (!url) continue;
    const weight = weightMatch?.[1] ?? "400";
    const face = new FontFace(family, `url(${url})`, { weight, display: "swap" });
    await face.load();
    document.fonts.add(face);
  }
}
```

- [ ] **Step 10.2: Commit**

```bash
git add client/components/canvas/load-font.ts
git commit -m "feat(canvas): font loader via FontFace api + proxied css"
```

---

## Task 11 — `FabricCanvas` client component

**Files:**
- Create: `client/components/canvas/FabricCanvas.tsx`

- [ ] **Step 11.1: Implement the component**

```tsx
// client/components/canvas/FabricCanvas.tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { FONT_FAMILIES } from "@/lib/fonts/families";
import type {
  CtaButtonLayer,
  Layer,
  ProductLayer,
  RectLayer,
  TemplateConfig,
  TextLayer,
} from "@/lib/templates/types";
import type { Language } from "@/lib/types";

import { loadProxiedFont } from "./load-font";

export interface FabricCanvasProps {
  template: TemplateConfig;
  productImageUrl: string;
  copy: { headline: string; subheadline: string; cta: string };
  language: Language;
  watermark?: boolean;
  /** CSS class on the wrapping div */
  className?: string;
  /** Visible canvas size — internal canvas is always template native res */
  displayWidth?: number;
}

export function FabricCanvas({
  template,
  productImageUrl,
  copy,
  language,
  watermark = false,
  className,
  displayWidth = 480,
}: FabricCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const family = FONT_FAMILIES[language];

    (async () => {
      try {
        const { fabric } = await import("fabric");
        if (cancelled || !canvasRef.current) return;

        await loadProxiedFont(family.slug, family.cssName);
        if (cancelled) return;

        // Dispose any previous canvas
        const fc = fabricRef.current as { dispose?: () => void } | null;
        fc?.dispose?.();

        const c = new fabric.Canvas(canvasRef.current, {
          width: template.canvas.width,
          height: template.canvas.height,
          selection: false,
          backgroundColor: template.canvas.background,
          enableRetinaScaling: true,
        });
        fabricRef.current = c;

        for (const layer of template.layers) {
          await renderLayer(fabric, c, layer, productImageUrl, copy, family.cssName);
        }

        if (watermark) {
          c.add(
            new fabric.Text("adcreator.in", {
              left: template.canvas.width - 24,
              top: template.canvas.height - 24,
              fontSize: 18,
              fill: "rgba(255,255,255,0.6)",
              fontFamily: "sans-serif",
              originX: "right",
              originY: "bottom",
              selectable: false,
            }),
          );
        }

        c.renderAll();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      const fc = fabricRef.current as { dispose?: () => void } | null;
      fc?.dispose?.();
      fabricRef.current = null;
    };
  }, [template, productImageUrl, copy, language, watermark]);

  const aspect = template.canvas.height / template.canvas.width;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: displayWidth,
        aspectRatio: `${template.canvas.width} / ${template.canvas.height}`,
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          borderRadius: 12,
        }}
      />
      {error ? (
        <p className="absolute inset-0 flex items-center justify-center text-caption text-destructive p-4 text-center">
          Canvas error: {error}
        </p>
      ) : null}
      {/* Avoid unused-var lint on aspect (used implicitly via aspectRatio) */}
      <span className="sr-only">{aspect.toFixed(2)}</span>
    </div>
  );
}

async function renderLayer(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: Layer,
  productImageUrl: string,
  copy: { headline: string; subheadline: string; cta: string },
  fontFamily: string,
): Promise<void> {
  if (layer.type === "rect") return renderRect(fabric, canvas, layer);
  if (layer.type === "product") return renderProduct(fabric, canvas, layer, productImageUrl);
  if (layer.type === "text") return renderText(fabric, canvas, layer, copy, fontFamily);
  if (layer.type === "cta_btn") return renderCtaBtn(fabric, canvas, layer);
  if (layer.type === "logo") return; // logo support lands with §14 brand kit
}

function renderRect(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: RectLayer,
) {
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill: layer.fill,
      rx: layer.rx,
      ry: layer.rx,
      selectable: false,
    }),
  );
}

async function renderProduct(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: ProductLayer,
  url: string,
) {
  await new Promise<void>((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) {
          reject(new Error("image load failed"));
          return;
        }
        const w = img.width ?? 1;
        const h = img.height ?? 1;
        const scale = Math.min(layer.w / w, layer.h / h);
        img.set({
          left: layer.x + (layer.w - w * scale) / 2,
          top: layer.y + (layer.h - h * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          shadow: layer.shadow
            ? new fabric.Shadow({ color: "rgba(0,0,0,0.45)", blur: 28, offsetY: 12 })
            : undefined,
        });
        canvas.add(img);
        resolve();
      },
      { crossOrigin: "anonymous" },
    );
  });
}

function renderText(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: TextLayer,
  copy: { headline: string; subheadline: string; cta: string },
  fontFamily: string,
) {
  const text = copy[layer.key];
  canvas.add(
    new fabric.Textbox(text, {
      left: layer.x,
      top: layer.y,
      width: layer.maxWidth,
      fontSize: layer.fontSize,
      fontFamily: `${fontFamily}, sans-serif`,
      fill: layer.fill,
      fontWeight: layer.fontWeight ?? "500",
      textAlign: layer.textAlign ?? "left",
      selectable: false,
      splitByGrapheme: true,
    }),
  );
}

function renderCtaBtn(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: CtaButtonLayer,
) {
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill: layer.fill,
      rx: layer.rx,
      ry: layer.rx,
      selectable: false,
    }),
  );
}
```

- [ ] **Step 11.2: Commit**

```bash
git add client/components/canvas/FabricCanvas.tsx
git commit -m "feat(canvas): FabricCanvas client component with font + image + text"
```

---

## Task 12 — `TemplateSelector` component

**Files:**
- Create: `client/components/canvas/TemplateSelector.tsx`

- [ ] **Step 12.1: Implement**

```tsx
// client/components/canvas/TemplateSelector.tsx
"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TemplateConfig } from "@/lib/templates/types";

export interface TemplateSelectorProps {
  templates: TemplateConfig[];
  value: string;
  onChange: (id: string) => void;
}

export function TemplateSelector({ templates, value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {templates.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`group relative aspect-square rounded-xl border bg-card overflow-hidden transition-all duration-fast ${
              selected
                ? "border-primary shadow-glow"
                : "border-border hover:border-input"
            }`}
            aria-pressed={selected}
          >
            <div
              className="absolute inset-0"
              style={{ background: t.canvas.background }}
            />
            <div className="absolute inset-0 flex items-end justify-between p-3">
              <Badge
                variant="outline"
                className="bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider font-mono"
              >
                {t.format}
              </Badge>
              {selected ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
            <span className="sr-only">{t.id}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
git add client/components/canvas/TemplateSelector.tsx
git commit -m "feat(canvas): TemplateSelector grid with selected state"
```

---

## Task 13 — Wire dashboard preview to real canvas

**Files:**
- Modify: `client/app/(dashboard)/dashboard/page.tsx` (replace placeholder preview with `<DashboardCanvas>` client component)
- Create: `client/app/(dashboard)/dashboard/canvas-preview.tsx` (client island holding the canvas + selector state)

- [ ] **Step 13.1: Create the client island**

```tsx
// client/app/(dashboard)/dashboard/canvas-preview.tsx
"use client";

import { useState } from "react";

import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { TemplateSelector } from "@/components/canvas/TemplateSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TemplateConfig } from "@/lib/templates/types";
import type { Language } from "@/lib/types";

const SAMPLE_COPY: Record<Language, { headline: string; subheadline: string; cta: string }> = {
  en: {
    headline: "Festival Sale",
    subheadline: "Limited time · Free delivery",
    cta: "Shop Now",
  },
  hi: {
    headline: "त्योहारी सेल",
    subheadline: "सीमित समय · फ्री डिलीवरी",
    cta: "अभी खरीदें",
  },
  ta: {
    headline: "திருவிழா சலுகை",
    subheadline: "வரம்பிலான நேரம் · இலவச டெலிவரி",
    cta: "இன்றே வாங்கு",
  },
  te: {
    headline: "పండుగ సేల్",
    subheadline: "పరిమిత సమయం · ఉచిత డెలివరీ",
    cta: "ఇప్పుడే కొనండి",
  },
};

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23ffffff'/><stop offset='100%25' stop-color='%23a1a1aa'/></linearGradient></defs><rect width='400' height='400' rx='32' fill='url(%23g)'/><text x='50%25' y='52%25' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%23111'>Sample product</text></svg>`,
  );

export interface CanvasPreviewProps {
  templates: TemplateConfig[];
  defaultTemplateId: string;
  language: Language;
}

export function CanvasPreview({
  templates,
  defaultTemplateId,
  language,
}: CanvasPreviewProps) {
  const [tplId, setTplId] = useState(defaultTemplateId);
  const tpl = templates.find((t) => t.id === tplId) ?? templates[0];

  return (
    <div className="space-y-5">
      <div className="spotlight-card relative bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <p className="text-label">Live preview</p>
          <Badge
            variant="outline"
            className="font-mono uppercase text-[10px] tracking-wider"
          >
            {tpl.format} · {tpl.canvas.width}
          </Badge>
        </div>

        <div className="flex justify-center">
          <FabricCanvas
            template={tpl}
            productImageUrl={SAMPLE_IMAGE}
            copy={SAMPLE_COPY[language]}
            language={language}
            displayWidth={420}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" disabled>
            Download
          </Button>
          <Button disabled>Generate copy</Button>
        </div>
      </div>

      <div>
        <p className="text-label mb-3">Template</p>
        <TemplateSelector
          templates={templates}
          value={tpl.id}
          onChange={setTplId}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 13.2: Update dashboard page to render the island**

Replace the right-column "Preview" card and the §11 placeholder with:

```tsx
// In client/app/(dashboard)/dashboard/page.tsx
// Replace the current "Right — preview" block with:

<div>
  <div className="sticky top-20">
    <CanvasPreview
      templates={TEMPLATES}
      defaultTemplateId={TEMPLATES[0]?.id ?? ""}
      language="hi"
    />
  </div>
</div>
```

Add at top:

```tsx
import { TEMPLATES } from "@/lib/templates/registry";

import { CanvasPreview } from "./canvas-preview";
```

- [ ] **Step 13.3: Verify build**

```bash
cd client && pnpm typecheck && pnpm lint && pnpm build
```

Expected: clean.

- [ ] **Step 13.4: Smoke test in browser**

```bash
cd client && pnpm dev &
sleep 4
open http://localhost:3000/dashboard
```

Manual check: preview card renders the festival_bright template with Devanagari sample copy, template selector switches between three templates, no console errors.

- [ ] **Step 13.5: Kill dev server and commit**

```bash
kill %1 2>/dev/null
git add client/app/\(dashboard\)/dashboard/
git commit -m "feat(dashboard): wire FabricCanvas preview with template selector"
```

---

## Task 14 — Wire marketing /templates page to real previews

**Files:**
- Modify: `client/app/(marketing)/templates/page.tsx`
- Create: `client/app/(marketing)/templates/templates-grid.tsx`

- [ ] **Step 14.1: Client island for the gallery**

```tsx
// client/app/(marketing)/templates/templates-grid.tsx
"use client";

import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { Badge } from "@/components/ui/badge";
import type { TemplateConfig } from "@/lib/templates/types";

const SAMPLE = {
  headline: "Festival Sale",
  subheadline: "Limited time · Free delivery",
  cta: "Shop Now",
};

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' rx='32' fill='%23e5e7eb'/><text x='50%25' y='52%25' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23111'>Sample</text></svg>`,
  );

export function TemplatesGrid({ templates }: { templates: TemplateConfig[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <article
          key={t.id}
          className="bg-card border border-border rounded-2xl p-6 hover:bg-accent transition-colors duration-fast"
        >
          <div className="flex justify-center mb-4">
            <FabricCanvas
              template={t}
              productImageUrl={SAMPLE_IMAGE}
              copy={SAMPLE}
              language="en"
              displayWidth={280}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium capitalize">
              {t.id.replace(/_/g, " ").replace(/\d+/g, "").trim()}
            </span>
            <Badge
              variant="outline"
              className="font-mono uppercase text-[10px] tracking-wider"
            >
              {t.format}
            </Badge>
          </div>
          <p className="text-caption capitalize mt-1">{t.category}</p>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 14.2: Update the page**

```tsx
// client/app/(marketing)/templates/page.tsx — replace existing default export
import type { Metadata } from "next";

import { TEMPLATES } from "@/lib/templates/registry";

import { TemplatesGrid } from "./templates-grid";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse all available ad templates by category and format.",
};

export default function TemplatesPage() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <div className="max-w-2xl mb-12">
        <p className="text-label mb-4">Templates</p>
        <h1 className="text-display">
          Designs that{" "}
          <span className="text-serif text-primary">actually</span> fit.
        </h1>
        <p className="text-body text-muted-foreground mt-5 text-lg">
          Three templates at launch. Square format. Pre-tested at every Indic
          script for overflow. More formats and categories land in §11.
        </p>
      </div>
      <TemplatesGrid templates={TEMPLATES} />
    </section>
  );
}
```

- [ ] **Step 14.3: Verify build**

```bash
cd client && pnpm typecheck && pnpm lint && pnpm build
```

- [ ] **Step 14.4: Commit**

```bash
git add client/app/\(marketing\)/templates/
git commit -m "feat(marketing): real fabric template previews on /templates"
```

---

## Task 15 — Final verification

- [ ] **Step 15.1: Full test suite**

```bash
cd client && pnpm test
```

Expected: all tests pass (≥ 16 tests across registry, route, fonts).

- [ ] **Step 15.2: typecheck + lint + build**

```bash
cd client && pnpm typecheck && pnpm lint && pnpm build
```

Expected: clean across all three.

- [ ] **Step 15.3: Manual smoke**

```bash
cd client && pnpm dev &
sleep 4
open http://localhost:3000/dashboard
open http://localhost:3000/templates
open http://localhost:3000/api/templates
open http://localhost:3000/api/fonts/noto-sans-devanagari
```

Manual check:
- `/dashboard` renders a real canvas in the preview card
- `/templates` shows three real previews
- `/api/templates` returns JSON with 3 templates
- `/api/fonts/noto-sans-devanagari` returns CSS containing `/api/fontfile/`

- [ ] **Step 15.4: Tick TODO checkboxes**

Update `TODO.md`:
- §11.1 — `/api/templates` ✅
- §11.4 — `FabricCanvas` ✅
- §11.5 — Format switcher (partial, single template family for now) ⏳
- §11.6 — Variant picker — pending
- §13 — `/api/fonts/[family]` ✅
- §13 — `/api/fontfile/[...path]` ✅
- Templates configs (3 of 12 at launch) ⏳

- [ ] **Step 15.5: Final commit**

```bash
git add TODO.md
git commit -m "docs: tick TODO for template engine + font proxy + GET /api/templates"
```

---

## Out of scope (deferred to next plan)

- 9×16 (Reels/Story) and 4×5 templates — formats listed but only 1×1 configs ship here
- `/api/templates` reading from the Supabase `templates` table — for now reads the in-memory registry
- Watermark gating (free vs paid) — `<FabricCanvas watermark>` prop exists but the dashboard hardcodes `false`
- Playwright snapshot test for canvas rendering at en/hi/ta/te — needs Playwright MCP wired
- Variant picker (3 copy variants tab) — depends on Groq route landing

---

## Spec coverage map

| Plan task | TODO section | Covered |
|---|---|---|
| 1 | §0.2 (testing deps) | ✅ |
| 2-3 | §11.3 (font proxy) | ✅ rewriter |
| 4 | §11.3, §13 (font CSS route) | ✅ |
| 5 | §13 (font binary route) | ✅ |
| 6 | §11.2 (template configs) | ✅ partial — 3 of 12 |
| 7 | §11.2 (registry) | ✅ |
| 8 | §11.1, §13 (GET /api/templates) | ✅ |
| 9-12 | §11.4 (FabricCanvas) | ✅ |
| 13 | §15.3 (dashboard preview) | ✅ |
| 14 | §15.1 (templates page) | ✅ |
