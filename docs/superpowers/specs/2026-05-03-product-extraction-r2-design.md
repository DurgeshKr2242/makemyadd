# Product Info Extraction + R2 Upload Pipeline — Design

**Date:** 2026-05-03
**Spec source:** TODO §4, §5, §6 + this doc.
**Scope:** Three sub-projects in a single cohesive cycle.

The lower-level pieces (URL scrape, R2 client, presign route, dashboard input form) are partially scaffolded. This spec hardens what's there, fills in the stubs, and adds the photo-extraction branch + manual-entry fallback so the create-ad funnel has a real working `Step 01 → Product`.

## Aesthetic intent (frontend-design)

The dashboard's `Step 01 → Product` already commits to a tabbed Upload/URL paradigm with a sticky preview on the right (DESIGN.md, §15). We are *not* redesigning. The new texture comes from how the form **responds** when scraping or uploading: a JSON-LD-rich page produces a richer "extracted card" with the merchant's brand mark + price; a hot-link-protected image still resolves because we re-host transparently; a hostile site is rejected with a tight, informational toast rather than a stack trace; a marketplace login wall is detected and the manual-entry dialog opens with the URL pre-filled. The unforgettable moment per page stays the editorial dashboard headline; the new texture is **resilience under varied real-world inputs**.

## Out of scope

- §4.2 custom-domain CDN (dashboard-side work in Cloudflare).
- §4.5 lifecycle rules (dashboard-side work).
- §7 background removal (next TODO section).
- Quota deduction on extract / upload calls (separate TODO).
- Retry policy on R2 5xx (let the AWS SDK's defaults handle it; revisit if telemetry shows pain).

## Architecture

```
┌─── Client (dashboard /step 01) ─────────────────────────────┐
│ <InputForm>                                                  │
│  ├─ <UrlPane>     → POST /api/generate/extract               │
│  ├─ <UploadPane>  → POST /api/upload/presign → PUT to R2     │
│  │                  → POST /api/generate/extract (photo)     │
│  └─ <ManualEntryDialog> ← opens on no_metadata/login_wall/   │
│                            vision_failed/user-click           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼─── Server ─────────────────────────────────┐
│ /api/upload/presign                                          │
│   • Zod-validate body (size/contentType allowlist)           │
│   • build key via uploadKey(user.id, ext)                    │
│   • getSignedUrl(r2, PutObjectCommand, expiresIn: 300)       │
│   • return {presignedUrl, key, publicUrl}                    │
│   • 503 r2_not_configured when env missing (inert pattern)   │
│                                                              │
│ /api/generate/extract                                        │
│   ├─ inputType: "url"                                        │
│   │   1. SSRF guard: protocol + IP-literal + DNS-resolve     │
│   │   2. fetch (5s, 2MB cap, html only)                      │
│   │   3. parse: JSON-LD Product → OG → <title>/<meta>/<h1>   │
│   │   4. DOMPurify-sanitize all strings                      │
│   │   5. blocklist (adult/restricted) → reject               │
│   │   6. login-wall detection → 422 login_wall               │
│   │   7. fetchAndRehostImage(og:image) → R2 processed bucket │
│   │   8. return ExtractResponse (rich: price, brand, etc.)   │
│   │                                                          │
│   └─ inputType: "photo"                                      │
│       1. resolve imageKey → R2 public URL                    │
│       2. Groq Vision call (llama-3.2-90b-vision-preview)     │
│       3. Zod-validate {name, description, category}          │
│       4. retry up to 3× with model fall-through              │
│       5. return ExtractResponse (image rehosted to processed)│
│                                                              │
│ Lib                                                          │
│   • lib/r2/client.ts          (fill stubs)                   │
│   • lib/r2/keys.ts            (already done)                 │
│   • lib/scrape/dns-guard.ts   (NEW — promisified dns.lookup) │
│   • lib/scrape/json-ld.ts     (NEW — Product schema parser)  │
│   • lib/scrape/blocklist.ts   (NEW — keyword filter)         │
│   • lib/scrape/login-wall.ts  (NEW — heuristic)              │
│   • lib/scrape/cheerio.ts     (extend — DNS guard,          │
│                                JSON-LD, sanitize, rehost)    │
│   • lib/scrape/rehost-image.ts(NEW — fetch + R2 upload)      │
│   • lib/groq/vision.ts        (NEW — Vision call wrapper)    │
└─────────────────────────────────────────────────────────────┘
```

## Validation contract

Single source of truth: `lib/schemas/generation.ts` (already exists; we extend it).

```ts
export const ExtractResponseSchema = z.object({
  productName: z.string().min(1).max(200),
  productDesc: z.string().max(2000),
  productImageUrl: z.string().url(),
  // NEW (optional — only present when JSON-LD or Vision returned them)
  brand:    z.string().max(80).optional(),
  price:    z.object({
              amount:   z.number().positive(),
              currency: z.string().length(3),     // ISO 4217 ("INR")
            }).optional(),
  category: z.enum(CATEGORIES).optional(),
});

export const ManualEntrySchema = z.object({
  productName: z.string().min(1).max(200),
  productDesc: z.string().min(1).max(500),
  category:    z.enum(CATEGORIES).optional(),
  imageKey:    z.string().min(1).optional(),  // R2 key if user uploaded
});
```

## Error codes

| Code | HTTP | Cause | UI behavior |
|---|---|---|---|
| `invalid_url` | 422 | bad URL / IP literal / blocked-host / private-DNS | inline error in URL pane |
| `dns_blocked` | 422 | hostname resolves to private IP | inline error |
| `fetch_failed` | 422 | upstream non-2xx, non-HTML, transport error | toast + open manual-entry |
| `timeout` | 422 | 5s scrape timeout | toast + open manual-entry |
| `body_too_large` | 422 | >2MB HTML body | toast |
| `no_metadata` | 422 | nothing useful on the page | open manual-entry pre-filled with URL |
| `login_wall` | 422 | `noindex` + suspicious title pattern | open manual-entry with explainer |
| `restricted_content` | 422 | adult/restricted keyword hit | toast (don't fall to manual entry) |
| `vision_failed` | 422 | Groq Vision returned invalid JSON 3× | open manual-entry with image preview |
| `r2_not_configured` | 503 | env keys missing | toast: "Photo upload coming soon" |
| `unauthorized` | 401 | no session | redirect via middleware (already wired) |

## SSRF guard layers

Already shipped: protocol (`https:`), IP-literal regex (v4 + v6 bracket), known internal hostnames (`localhost`, `*.local`, `*.internal`, `metadata.google.internal`).

Missing layer (this spec adds): **DNS resolution.** Even with the regex blocking `https://10.0.0.1`, an attacker can register `evil.com` with an A-record `10.0.0.1` and bypass us. Mitigation:

1. After all string-level checks pass, `dns.promises.lookup(hostname, { all: true })`.
2. Reject if **any** answer is in: 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, 100.64/10 (CGNAT), `::1`, `fc00::/7`, `fe80::/10`. Helper covers IPv4 + IPv6.
3. Reject if `lookup` itself errors (NXDOMAIN, etc.).
4. **TOCTOU:** between our `lookup` and `fetch`, the resolver could return a different answer. Mitigated by always passing the original hostname into `fetch` (the `https-verify` of the cert ensures the destination matches the hostname, and a TOCTOU racing the DNS cache is a much narrower attack window than the bare hostname-blocklist).

We accept TOCTOU as a residual risk for MVP; the realistic attack profile is automated SSRF probes hitting the metadata endpoint, all of which the regex + DNS guard together close. A perfect fix needs custom DNS resolver in `fetch`'s undici agent — out of scope.

## Login-wall detection

Heuristic, fires AFTER scraping succeeds with no_metadata OR with metadata that smells fake:

- Page has `<meta name="robots" content="noindex">` AND title matches `/sign in|log in|account|page not found|access denied/i`.
- Final URL after redirects is on a different hostname AND contains `login|signin|account|auth` in the path.
- HTML body contains "Please log in to continue" / Hindi/Tamil equivalents (extensible blocklist).

False positives are tolerable here — we open the manual-entry dialog with the URL pre-filled, user clicks past it, no harm.

## JSON-LD Product schema

Most modern Indian D2C platforms (Shopify, WooCommerce, custom) ship a `<script type="application/ld+json">` with `@type: Product`. We parse it FIRST because it's machine-readable and richer than OG tags.

```ts
const ProductSchema = z.object({
  "@type": z.literal("Product").or(z.array(z.literal("Product"))),
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.union([
    z.string(),
    z.array(z.string()),
    z.object({ "@type": z.literal("ImageObject"), url: z.string() }),
  ]).optional(),
  brand: z.union([
    z.string(),
    z.object({ name: z.string() }),
  ]).optional(),
  offers: z.object({
    price: z.union([z.string(), z.number()]),
    priceCurrency: z.string(),
  }).optional(),
});
```

Iterate every `<script type="application/ld+json">` block, parse, recurse into `@graph` arrays, find the first `Product`. Fall through to OG when not found OR when parse fails.

## R2 client surface

```ts
// lib/r2/client.ts — fill stubs
export async function getR2Client(): Promise<S3Client>;        // existing
export const R2_BUCKETS: { uploads, processed, public };       // existing
export type R2Bucket;                                           // existing

// New helpers
export async function uploadToR2(
  buffer: Uint8Array | Buffer,
  key: string,
  contentType: string,
  bucket: R2Bucket = "uploads",
): Promise<{ key: string; publicUrl: string }>;

export async function presignPut(
  key: string,
  contentType: string,
  bucket: R2Bucket = "uploads",
  expiresIn?: number,
): Promise<string>;

export function publicUrl(key: string, bucket?: R2Bucket): string;

export function isR2Configured(): boolean;  // returns true iff all env keys present
```

`isR2Configured()` is the inert-pattern gate. Routes that need R2 check it first and return 503 `r2_not_configured` if false. Matches `verifyTurnstileToken`'s "no secret → pass through" idiom.

## Image re-hosting

```ts
// lib/scrape/rehost-image.ts
export async function fetchAndRehostImage(
  imageUrl: string,
  opts?: { timeoutMs?: number; maxBytes?: number },
): Promise<{ rehostedUrl: string; rehostedKey: string } | { skipped: true; reason: string }>;
```

- If `isR2Configured()` is false → skip, return `{ skipped, reason: "r2_not_configured" }`. Caller falls back to the original URL.
- Fetch with 5s timeout, 5MB cap.
- Content-type must start with `image/`. Reject `image/svg+xml` (XSS via SVG).
- Stream to a buffer with size cap.
- `uploadToR2(buffer, processedKey(), contentType, "processed")`.
- Return `{ rehostedUrl, rehostedKey }`.
- On any failure: log + return `{ skipped, reason }`. **Never throw.** Caller falls back to original URL — better to ship a hot-link-fragile ad than to break the funnel.

## Photo path (Groq Vision)

```ts
// lib/groq/vision.ts
export async function describeProductImage(
  imageUrl: string,
): Promise<{ name: string; description: string; category?: Category }>;
```

- Lazy-import `groq-sdk`.
- Model: `process.env.GROQ_VISION_MODEL` ?? `"meta-llama/llama-4-scout-17b-16e-instruct"` (current Groq vision; document the env-override knob in `.env.example`).
- Prompt:
  > You are a product-image describer for an ad-creation tool. Identify the product in the image. Return ONLY a JSON object with three keys: `name` (≤80 chars, English), `description` (≤500 chars, English, mention material/use/audience), `category` (one of: fashion, food, electronics, beauty, home). No prose around the JSON.
- `response_format: { type: "json_object" }` if model supports.
- Zod-validate the parsed JSON.
- Retry up to 3× with **temperature ramp** (0.2, 0.4, 0.6) — cooler attempts produce more deterministic JSON; warmer fallback for awkward images.
- Throw `VisionError("vision_failed", ...)` after 3 strikes. Route maps to 422 `vision_failed`.

## ManualEntryDialog component

- Base UI `<Dialog>` (already a primitive). Trigger: route handler 422 with code in `{no_metadata, login_wall, vision_failed}` → URL pane / upload pane sets `manualEntryOpen = true` with a hint object `{ source: "url"|"photo"|"user", urlIfAny, imageUrlIfAny }`.
- Fields: name, description, category dropdown, optional image upload (re-uses §5 presign flow).
- RHF + Zod (`ManualEntrySchema`).
- On submit → updates `extractedProduct` directly in the dashboard shell — bypasses `/api/generate/extract`. The flow then proceeds normally.
- Keyboard: ESC closes, focus trap inside (Base UI default).
- Responsive: full-screen `<Sheet>` on mobile (`sm` and below), centered modal on `md+`.

## UrlPane "extracted card" polish

When `onProductExtracted` fires with rich data:

- Header row: thumbnail (rehosted image) + product name + brand pill.
- Description line: 2-line clamp with full text on hover.
- Footer row: price (Geist Mono, currency code subtle), "Edit details" link → opens `<ManualEntryDialog>` pre-filled, "Clear" icon-button.

Layout uses CSS Grid with `grid-template-columns: 56px 1fr auto`. Asymmetric per the UI skill rule. No new design tokens.

## UploadPane wiring

Drag/drop + click → preview locally → fetch `/api/upload/presign` → PUT with progress (XHR — fetch can't expose upload progress).

```ts
type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "uploaded"; key: string; publicUrl: string }
  | { status: "error"; message: string };
```

UI: progress bar fills the dropzone bottom edge during upload. On success → updates `inputValue` to `{ type: "uploaded", file, previewUrl, key, publicUrl }` (extending existing `InputValue` union) and triggers `/api/generate/extract` with `inputType: "photo", imageKey: key`.

Retry policy: one retry on network failure (re-fetch presign + re-PUT). Beyond that → error toast + manual-entry option.

## Files touched

**New (10):**
- `lib/r2/client.test.ts`
- `lib/scrape/dns-guard.ts` + test
- `lib/scrape/json-ld.ts` + test
- `lib/scrape/blocklist.ts` + test
- `lib/scrape/login-wall.ts` + test
- `lib/scrape/rehost-image.ts` + test
- `lib/groq/vision.ts` + test
- `components/generate/manual-entry-dialog.tsx`
- `app/api/upload/presign/route.test.ts` (already exists per earlier grep — verify; expand if stub)
- `e2e/extraction-flow.spec.ts` (gated on `E2E_LIVE_R2`)

**Modified (8):**
- `lib/r2/client.ts` — fill `uploadToR2`, `presignPut`, `publicUrl`, `isR2Configured`.
- `lib/scrape/cheerio.ts` — wire DNS guard, JSON-LD parse, DOMPurify, login-wall, blocklist, rehost.
- `lib/schemas/generation.ts` — add `brand`, `price`, `ManualEntrySchema`.
- `app/api/upload/presign/route.ts` — implement presign.
- `app/api/generate/extract/route.ts` — surface new error codes, photo path.
- `components/generate/url-pane.tsx` — richer extracted card, Edit button.
- `components/generate/input-form.tsx` — wire UploadPane uploads, extend `InputValue`.
- `app/(dashboard)/dashboard/dashboard-shell.tsx` — ManualEntryDialog integration.

**Untouched:**
- `lib/r2/keys.ts` — already correct.
- `lib/turnstile.ts`, `lib/auth/*` — unrelated.

## Testing

- **Vitest unit:**
  - DNS guard: mock `dns.promises.lookup` returning private/public addresses.
  - JSON-LD: real-world fixtures from Shopify, WooCommerce, custom Indian D2C; corrupt/missing JSON.
  - Blocklist: positive + negative samples.
  - Login-wall: `noindex` + title combinations.
  - rehost-image: mocked fetch + R2 mock; r2_not_configured pass-through.
  - vision: mocked Groq SDK; valid JSON / invalid JSON / 3-strikes failure.
  - Presign route: 401/400/200/503 paths.
  - cheerio integration: end-to-end with all guards in place.
- **Playwright e2e** (`E2E_LIVE_R2=1`): drag a real fixture image → presign → PUT to R2 → extract → land on dashboard shell with rich card.

## Risks

| Risk | Mitigation |
|---|---|
| AWS SDK cold-start cost on Vercel function | Lazy import (already in `lib/r2/client.ts`). Only paid by routes that touch R2. |
| Groq Vision model name churn | `GROQ_VISION_MODEL` env override; default updated when Groq deprecates. |
| Hot-link-protected images break preview | rehost-image returns `skipped` instead of throwing; UI uses original URL. |
| JSON-LD parse blowup on hostile sites | Wrapped in try/catch; fall-through to OG. Per-script try/catch so one bad script doesn't kill the page. |
| R2 5xx mid-upload | Single retry on the client (re-fetch presign + re-PUT). Beyond that, manual-entry. |
| DNS TOCTOU | Documented as residual risk. Realistic attack surface (metadata.google.internal etc.) covered by static blocklist. |
| Adult-content false positive on legitimate Indic descriptions | Blocklist is keyword-based and English-only at MVP; false-positive rate measured before turning it strict. Phase 2 wires LLM-based moderation. |
| Deep-clone of `<InputValue>` shape change breaks existing tests | Add a discriminator. Existing `"file"` variant becomes `"file" | "uploading" | "uploaded"` — tests get explicit updates per task. |

## Definition of done

1. `pnpm test` green.
2. `pnpm typecheck` + `pnpm lint` clean.
3. URL pane: pasting a real Shopify URL produces a rich extracted card with brand + price.
4. Upload pane: drag → presign → PUT → photo path → Vision response → land on dashboard with extracted info. (Requires R2 + Groq keys.)
5. Hostile inputs (private IPs, IP literals, hostnames resolving to RFC1918, login walls, adult keywords) all rejected with the right error codes.
6. R2 inert-without-keys: app boots, /api/upload/presign returns 503 r2_not_configured cleanly.
7. ManualEntryDialog opens automatically on `no_metadata`/`login_wall`/`vision_failed`; submit updates dashboard state.
8. Reduced-motion users: no upload-progress animation, no dialog enter animation.
9. Mobile (360px): UploadPane dropzone visible, ManualEntryDialog full-screen Sheet.
