# India AI Ad Creator — Build TODO

> Source of truth: `docs/adcreator_technical_spec.pdf` (v1.0, 28 April 2026, 49 pp).
> Stack: **Next.js 16 canary (App Router) · Supabase · Groq · HuggingFace · Cloudflare R2 · Razorpay**.
> Languages at MVP: **English (en) · Hindi (hi) · Tamil (ta) · Telugu (te)**.
> Project root: `/Users/durgesh/Code/Personal/makemyadd` (the `client/` directory is currently empty — this is where the Next.js app will live).
>
> This file is the working build plan. Every section below maps to a section of the spec. Tick boxes as work lands. Do not delete unchecked items — open a follow-up issue and move it down to "Phase 2" if descoped.
>
> **Why canary across the board?** The spec was written against Next.js 14, but as of April 2026 the latest released line is Next.js 16. We track `@canary` for Next.js (≥ `16.2.0-canary.37`) so we get (1) version-matched docs bundled at `node_modules/next/dist/docs/` for AI agents, (2) auto-generated `AGENTS.md` + `CLAUDE.md` from `create-next-app`, and (3) the Next.js MCP server that exposes live app state to agents. Apply the same "use the version that ships agent affordances" principle to every other tool below — see Section 0.5.

---

## Legend

- [ ] not started
- [~] in progress
- [x] done
- [!] blocked / needs decision
- 🔒 security-critical (do not skip)
- 💸 cost-impacting (verify free-tier numbers before shipping)
- 🇮🇳 India-specific behaviour (script, language, UPI, INR, etc.)

---

## 0. Repo & Tooling Bootstrap

### 0.1 Scaffold the app (canary, agent-ready)

- [x] Initialise git in the repo root **before** scaffolding so `create-next-app` doesn't create a nested repo.
  - `git init && git branch -M main`
- [x] Scaffold the Next.js app inside `client/` using **canary** so we get bundled docs + agent files:
  - `pnpm create next-app@canary client --ts --tailwind --biome --app --import-alias "@/*" --use-pnpm --disable-git --yes`
  - Auto-generates `client/AGENTS.md` + `client/CLAUDE.md`. Moved to repo root and rewrote the docs path to `client/node_modules/next/dist/docs/`.
- [x] Verify the docs are present after install: `client/node_modules/next/dist/docs/01-app/02-guides/` populated.
- [ ] Pin Next.js to a specific canary in `client/package.json` (currently `^16.3.0-canary.5` — pin to exact for reproducibility once we hit RC).
- [x] Add `.gitignore` covering env, build, OS, sentry, playwright artefacts.
- [x] Decision: **no monorepo at MVP**. Single app at `client/`.
- [x] Path alias `@/*` set by `create-next-app`.
- [x] **Biome** instead of ESLint + Prettier (`--biome` flag on canary).
- [x] Husky 9 + lint-staged 16 (pre-commit Biome, pre-push tsc).
- [x] `commitlint` 20 (Conventional Commits, commit-msg hook). Subject-case relaxed for proper-noun file names.
- [x] `@types/node`, `@types/react`, `@types/react-dom` from scaffold.
- [x] npm scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `typecheck`, `mcp:doctor`. Remaining: `test`, `test:e2e`, `db:*`, `r2:sync`, `templates:seed`.
- [x] `tsconfig.json`: `noUncheckedIndexedAccess` + `noFallthroughCasesInSwitch` enabled. (`exactOptionalPropertyTypes` deferred — would touch many sites for marginal gain.)
- [x] README.md at repo root (quickstart, env reference per 501 stub, troubleshooting, agent tooling pointer).
- [x] CONTRIBUTING.md (branching, Conventional Commits, PR checklist, tooling rules, AI-agent tooling pointer).

### 0.2 Dependencies to install

Use the **canary / latest** channel on every package that ships agent affordances. For everything else, pin a known-good version.

- [x] **Core:** `next@16.3.0-canary.5`, `react@19.2.5`, `react-dom@19.2.5`, `typescript@5.9.3`.
- [x] **Supabase:** `@supabase/supabase-js@2.105.1`, `@supabase/ssr@0.10.2`, `server-only@0.0.1`. **Pending:** `supabase` CLI devDep for `db:types` (deferred — install when wiring real auth).
- [x] **R2 / S3:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`. **Pending:** `wrangler` devDep.
- [x] **AI providers:** `groq-sdk@1.1.2`, `@huggingface/inference@4.13.15`.
- [x] **Canvas:** `fabric@5.5.2` + `@types/fabric` — dynamic-imported in `FabricCanvas`.
- [x] **Payments:** `razorpay@2.9.6` (server SDK). Razorpay Checkout will load via `<Script>` at use site.
- [x] **Validation:** `zod@4.3.6`.
- [x] **State:** `@tanstack/react-query@latest` + `zustand@latest`. QueryProvider client island wired in app/layout.tsx with sane defaults (60s staleTime floor, no refetch-on-focus, 4xx-skip retry, devtools in dev). First useTemplates() hook + useGenerationStore landed in `800edc3`.
- [x] **UI:** `tailwindcss@4`, `lucide-react@1.14.0`, `class-variance-authority`, `clsx`, `tailwind-merge`.
  - shadcn@canary `base-nova` preset (Base UI primitives, **`render` prop not `asChild`**) + 25 components installed.
- [x] **Email:** `resend@latest` + `react-email@latest` + `@react-email/components`. Lazy server client, typed `EmailResult` sender, first welcome template (saffron CTA on near-black, inline hex for email-client compat), 4 vitest cases. Inert until `RESEND_API_KEY` lands. Landed `23f52a1`.
- [x] **Analytics:** `posthog-js@latest` + `posthog-node@latest`. Server-side `captureServerEvent` + client `<PostHogProvider>` (autocapture clicks/forms, page-view on route change, opted-out in dev). Inert until `NEXT_PUBLIC_POSTHOG_KEY` lands. Landed `23f52a1`.
- [x] **Errors:** `@sentry/nextjs@10.51.0` instrumentation files (client/server/edge configs + instrumentation.ts + per-route error.tsx Sentry.captureException). Inert until SENTRY_DSN lands. Landed `783336f`.
- [x] **Bot:** `@marsidev/react-turnstile@1.5.1`. `<TurnstileGate>` mounted in signup card with three render states (dev-bypass / loading / verified / error). Dark theme, flexible size. Token captured into local state ready for the §6 Supabase wiring. Landed `a54b71b`.
- [x] **Scraping:** `cheerio@1.2.0`.
- [ ] **Hashing:** `sharp-phash`. Defer until §7.3 BG-cache wiring.
- [x] **Image utils:** `sharp@0.34.5`. Already noted to set `serverExternalPackages: ['sharp']` in `next.config.ts` when first used.
- [x] **Testing:** `vitest@4.1.5`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `@playwright/test@1.59.1` (Chromium-only, with per-language Indic canvas-taint coverage). **Pending:** `msw` (defer to API integration tests), `@playwright/mcp` (separate dev tool).
- [x] **Misc:** `nanoid@5.1.9`. **Pending:** `date-fns`, `isomorphic-dompurify`, `tiny-invariant`.

---

## 0.5 AI Agent / MCP Setup (do this first — agents work better from here on)

The whole bootstrap aims at one outcome: **every tool in the stack is reachable through MCP or a version-matched local doc index**. Agents stop guessing and start grounding.

### 0.5.1 Project-level agent files

- [x] `AGENTS.md` at repo root (auto-generated by `create-next-app@canary`, then moved up). Contains the Next.js-managed block delimited by `<!-- BEGIN:nextjs-agent-rules -->` / `<!-- END:nextjs-agent-rules -->` — **do not edit inside the markers** (regenerated on Next.js upgrades).
- [x] Append project-specific rules **outside** the markers (Indic snapshots, RLS, Razorpay PAN discipline, MCP usage).
- [x] `CLAUDE.md` at repo root contains `@AGENTS.md`.
- [x] **Project-level skill** at `.claude/skills/ui/SKILL.md` — auto-activates on any UI work, enforces `client/DESIGN.md`, shadcn-only policy, `render` vs `asChild`, all 8 component states, Indic snapshots.
- [x] **Design system source of truth**: `client/DESIGN.md` — tokens, motion, density, accessibility, anti-patterns. Visual lock at `/design`.
- [x] `.cursor/rules/project.mdc` — Cursor always-apply rule mirroring AGENTS.md. Landed `2e164c5`.
- [x] `.github/copilot-instructions.md` — Copilot auto-loaded mirror of AGENTS.md. Landed `2e164c5`.

### 0.5.2 MCP server catalogue (`.mcp.json` at repo root, committed)

`.mcp.json` is committed with all 11 servers wired. `pnpm mcp:doctor` smoke-tests them.

- [ ] **Next.js MCP server** — wire `experimental.mcpServer: true` in `next.config.ts` once the dev server is being used. Currently DOWN in `mcp:doctor` (expected — dev server isn't running).
- [x] **Supabase MCP** — `supabase-local` (read-write) + `supabase-prod` (read-only) configured. SKIP'd in doctor until tokens set.
- [x] **Cloudflare MCP suite** — `cloudflare-r2` (currently fetch-fails — endpoint URL likely needs updating) and `cloudflare-observability` (UP).
- [x] **Vercel MCP** — UP (401 = endpoint live, awaits OAuth).
- [x] **Sentry MCP** — wired (returns 410, may need URL update once Sentry wizard is run).
- [x] **PostHog MCP** — wired (`@posthog/mcp`), SKIP until token set.
- [x] **GitHub MCP** — UP.
- [x] **shadcn/ui MCP** — UP (stdio handshake).
- [x] **Playwright MCP** — UP (stdio handshake).
- [ ] **Razorpay** in-house MCP wrapper at `tools/mcp/razorpay/`. Low priority.
- [ ] HuggingFace / Groq MCPs — none yet, defer.

### 0.5.3 `.mcp.json` skeleton

```json
{
  "mcpServers": {
    "nextjs": { "url": "http://localhost:3000/_next/mcp" },
    "supabase-local":  { "command": "npx", "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "${SUPABASE_PROJECT_REF_LOCAL}"] },
    "supabase-prod":   { "command": "npx", "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "${SUPABASE_PROJECT_REF_PROD}", "--read-only"] },
    "cloudflare-r2":   { "url": "https://r2.mcp.cloudflare.com/sse" },
    "cloudflare-obs":  { "url": "https://observability.mcp.cloudflare.com/sse" },
    "vercel":          { "url": "https://mcp.vercel.com/sse" },
    "sentry":          { "url": "https://mcp.sentry.dev/sse" },
    "posthog":         { "command": "npx", "args": ["-y", "@posthog/mcp-server@latest"] },
    "github":          { "url": "https://api.githubcopilot.com/mcp/" },
    "shadcn":          { "command": "pnpm", "args": ["dlx", "shadcn@canary", "mcp"] },
    "playwright":      { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
  }
}
```

- [x] Added `pnpm mcp:doctor` script via `tools/mcp-doctor.mjs`. (CI nightly run pending — depends on a separate cron workflow.)
- [ ] Document MCP auth token sources in README's "AI agent setup" section. Tokens go in `~/.config/claude/.env` or per-MCP keychains, **never** committed.

### 0.5.4 Documentation grounding

- [x] Generated `client/public/llms.txt` + `client/public/llms-full.txt` (llmstxt.org spec — README + CONTRIBUTING dump for external AI agents). Landed `7bd3d43`.
- [ ] Add a `pnpm docs:next` helper that opens `node_modules/next/dist/docs/index.mdx` — humans get the same source the agents do.
- [ ] Bookmark Next.js MCP support page (`https://nextjs.org/docs/app/guides/mcp-server`) in CONTRIBUTING.md.

### 0.5.5 Anti-patterns to avoid

- ❌ Don't pin Next.js to a stable old version once we're on canary — we lose bundled docs and the MCP server.
- ❌ Don't paste env vars into MCP arguments inline — use `${VAR}` substitution so they're per-shell, not in `.mcp.json`.
- ❌ Don't enable read-write Supabase MCP against the prod project ref. Two separate entries (`supabase-local`, `supabase-prod` with `--read-only`).
- ❌ Don't skip the `mcp:doctor` script — silent MCP failures send agents back to hallucinations.

---

## 1. Repository Layout

Mirror the spec exactly so file paths stay grep-able against the doc.

### 1.0 Repo root (outside `client/`)

- [x] `AGENTS.md` (canary-generated, moved up from `client/`; see 0.5.1)
- [x] `CLAUDE.md` (one-liner `@AGENTS.md`)
- [x] `.mcp.json` (MCP server catalogue)
- [x] `tools/mcp-doctor.mjs` + `pnpm mcp:doctor` script
- [x] `.cursor/rules/project.mdc` mirrored from AGENTS.md
- [x] `.github/copilot-instructions.md` mirrored from AGENTS.md
- [ ] `tools/mcp/razorpay/` (in-house MCP wrapper, lazy)
- [x] `docs/adcreator_technical_spec.pdf` (already present)
- [x] `docs/adcreator_technical_spec.txt` (extracted text)
- [x] `.env.example` (full env reference per §20)
- [x] `supabase/{config.toml, migrations/*.sql, seed.sql}` (DDL landed — see §2)

### 1.1 Inside `client/`

- [x] `client/app/(auth)/login/page.tsx` (UI scaffolded; submit handler lands with §6)
- [x] `client/app/(auth)/signup/page.tsx` (Turnstile mount placeholder)
- [x] `client/app/(auth)/auth/callback/route.ts` (OAuth code exchange wired via `lib/supabase/server`)
- [x] `client/app/(auth)/auth/forgot/page.tsx`
- [x] `client/app/(auth)/auth/reset/page.tsx`
- [x] `client/app/(marketing)/page.tsx` (full landing — hero, lang tiles, features)
- [x] `client/app/(marketing)/pricing/page.tsx` (4-plan grid)
- [x] `client/app/(marketing)/templates/page.tsx` (gallery placeholders)
- [x] `client/app/(marketing)/legal/terms/page.tsx`
- [x] `client/app/(marketing)/legal/privacy/page.tsx`
- [x] `client/app/(marketing)/legal/refund/page.tsx`
- [x] `client/app/(marketing)/legal/shipping/page.tsx` (Razorpay onboarding)
- [x] `client/app/(dashboard)/layout.tsx` (session gate via `getUser`, falls back to dev mode if Supabase env unset)
- [x] `client/app/(dashboard)/dashboard/page.tsx` (3-step input + sticky preview placeholder)
- [x] `client/app/(dashboard)/history/page.tsx` (empty state)
- [x] `client/app/(dashboard)/history/[id]/page.tsx`
- [x] `client/app/(dashboard)/billing/page.tsx` (usage + plan grid + cancel card)
- [x] `client/app/(dashboard)/billing/success/page.tsx`
- [x] `client/app/(dashboard)/settings/page.tsx`
- [~] `client/app/api/upload/presign/route.ts` (Zod + auth shell, 501 — body lands with §5)
- [x] `client/app/api/generate/extract/route.ts` — URL path REAL (Cheerio + SSRF guard, 5s timeout, 2 MB streaming cap, content-type allowlist, 422 on scrape failure, 15 vitest cases). Photo path still 501 (needs GROQ_API_KEY for vision). Landed `3579a6c`.
- [~] `client/app/api/generate/bgremove/route.ts` (Zod + auth shell, 501 — body lands with §7)
- [~] `client/app/api/generate/copy/route.ts` (Zod + Turnstile + auth shell, 501 — body lands with §8)
- [~] `client/app/api/generations/route.ts` (cursor/limit Zod + auth shell, 501)
- [~] `client/app/api/generations/[id]/route.ts` (UUID validation + auth shell, 501; 404 on bad uuid)
- [x] `client/app/api/templates/route.ts` (Zod-validated `?format=&category=` filters; 5 vitest cases)
- [~] `client/app/api/payments/create-order/route.ts` (Zod + auth shell, 501 — body lands with §12)
- [~] `client/app/api/payments/webhook/route.ts` (HMAC-SHA256 + timing-safe-compare wired; fail-closed 503 if secret unset; 501 after pass)
- [~] `client/app/api/payments/cancel/route.ts` (auth shell, 501)
- [x] `client/app/api/fonts/[family]/route.ts` (Google Fonts CSS proxy with URL rewrite to `/api/fontfile/...`)
- [x] `client/app/api/fontfile/[...path]/route.ts` (woff2 binary proxy, 1y immutable cache, SSRF guard)
- [x] `client/app/api/turnstile/verify/route.ts` (fully wired — calls `verifyTurnstileToken`, returns `{success}`)
- [x] `client/components/canvas/FabricCanvas.tsx` (dynamic-imports fabric, loads proxied font via `loadProxiedFont`, renders rect/product/text/cta_btn layers, optional watermark, Indic-safe watermark font, exhaustive layer dispatch)
- [x] `client/components/canvas/TemplateSelector.tsx` (grid w/ shadow-glow on selected, format badge, aria-pressed)
- [x] `client/components/canvas/load-font.ts` (FontFace API helper, parallel weight load, Safari absolute-URL resolution)
- [x] `client/components/generate/progress-stepper.tsx` (6-step horizontal/vertical stepper with running/done/failed states)
- [x] `client/components/generate/copy-variants.tsx` (3-tab variant selector, lang-aware)
- [x] `client/components/generate/language-picker.tsx` (4 chip-style language buttons + tone Select)
- [x] `client/components/generate/input-form.tsx` (drag-drop upload + URL validation; 9 vitest cases for `isAcceptableProductUrl` SSRF guard)
- [x] `client/components/billing/plan-modal.tsx` (4-plan upgrade modal triggered when quota hit; uses DRY `lib/billing/plans.ts`)
- [x] `client/components/command/command-palette.tsx` (⌘K / Ctrl+K global palette via cmdk; module-level setter pattern, no context)
- [x] `client/lib/billing/plans.ts` (single PLANS source of truth used by /pricing + PlanModal)
- [x] `client/lib/generate/use-mock-generation.ts` (mock state machine for the 6-step flow + fake variants per language; 2 vitest cases via fake timers)
- [x] `client/components/ui/button-link.tsx` (Next Link styled with `buttonVariants` — replaces all `<Button render={<Link/>}>` patterns; documented in DESIGN.md)
- [ ] `client/components/canvas/FormatSwitcher.tsx` (defer — current TemplateSelector covers it adequately)
- [x] `client/components/generate/InputForm.tsx` (drag-drop + URL validation, 9 vitest cases — landed in `4218e75`)
- [x] `client/components/generate/ProgressStepper.tsx` (6-step, running/done/failed states — landed in `86ddc72`)
- [x] `client/components/billing/PlanModal.tsx` (4-plan upgrade modal — landed in `53f1fbc`)
- [x] `client/components/dashboard/usage-badge.tsx` (placeholder; quota wiring pending)
- [x] `client/components/dashboard/dashboard-header.tsx`
- [x] `client/components/marketing/site-header.tsx`, `site-footer.tsx`, `legal-page.tsx`
- [x] `client/lib/supabase/client.ts`
- [x] `client/lib/supabase/server.ts`
- [x] `client/lib/supabase/admin.ts` (`server-only` guard + Biome no-restricted-imports backstop)
- [x] `client/lib/supabase/database.types.ts` (placeholder; regen via `pnpm db:types`)
- [x] `client/lib/r2/client.ts` (lazy S3Client)
- [x] `client/lib/r2/keys.ts` (uniform key naming)
- [x] `client/lib/groq/client.ts` (lazy SDK + Zod schemas)
- [x] `client/lib/groq/prompts.ts` (4 system prompts + `isScriptPure` check)
- [x] `client/lib/hf/bgremove.ts` (stub)
- [x] `client/lib/hf/mask.ts` (stub)
- [x] `client/lib/razorpay/client.ts` (lazy SDK)
- [x] `client/lib/razorpay/plans.ts` (env → plan_id mapper)
- [x] `client/lib/quota.ts` (stub)
- [x] `client/lib/scrape/cheerio.ts` (stub)
- [x] `client/lib/turnstile.ts` (verify helper, dev-mode bypass)
- [x] `client/lib/posthog.ts` (stub)
- [x] `client/lib/schemas/generation.ts` (presign / extract / bgremove / copy)
- [x] `client/lib/schemas/payments.ts`
- [x] `client/lib/templates/registry.ts` (empty registry, ready for §11)
- [x] `client/lib/templates/types.ts` (Layer + TemplateConfig)
- [x] `client/lib/templates/configs/*.ts` — **10 templates** across all 3 formats: festival_bright × {1x1, 9x16, 4x5}, clean_minimal × {1x1, 9x16, 4x5}, urgency_red × {1x1, 9x16, 4x5}, trust_badge_01_1x1
- [x] `client/lib/fonts/{proxy,families}.ts` + `proxy.test.ts` (font CSS rewriter — 7 vitest cases, handles bare/quoted urls)
- [x] `client/lib/types.ts` (Plan / Language / Format / Tone / Category + PLAN_LIMITS)
- [x] `client/lib/env.ts` (Zod-validated public env)
- [x] `client/lib/env.server.ts` (Zod-validated server env, `server-only`)
- [x] `client/middleware.ts` (session refresh + redirect to /login on protected paths + 401 on protected APIs)
- [x] `client/next.config.ts` (default; will tighten with `serverExternalPackages: ['sharp']` + `mcpServer` flag when needed)
- [x] `client/supabase/migrations/20260429000001_profiles.sql`
- [x] `client/supabase/migrations/20260429000002_subscriptions.sql`
- [x] `client/supabase/migrations/20260429000003_templates.sql`
- [x] `client/supabase/migrations/20260429000004_generations.sql`
- [x] `client/supabase/migrations/20260429000005_copy_cache.sql`
- [x] `client/supabase/migrations/20260429000006_image_cache.sql`
- [x] `client/supabase/migrations/20260429000007_phase2_scaffold.sql`
- [x] `client/supabase/seed.sql`
- [x] `client/supabase/config.toml`
- [ ] `client/public/fonts/` (self-hosted Noto fallbacks)

---

## 2. Database Schema (Supabase / PostgreSQL 15)

All DDL via `client/supabase/migrations/*.sql`. **Never** edit through the dashboard.

### 2.1 `profiles`
- [ ] FK to `auth.users(id)` with `on delete cascade`.
- [ ] Columns: `id`, `full_name`, `avatar_url`, `plan` (`free|starter|pro|agency`, default `free`), `generation_count`, `monthly_reset_at`, `razorpay_customer_id` (unique, nullable), `created_at`, `updated_at`.
- [ ] Trigger `handle_new_user()` (`security definer`, `set search_path = public`) to insert profile from `auth.users.raw_user_meta_data`.
- [ ] Trigger to bump `updated_at` on update.
- [ ] RLS: `Users read own profile` (select where `auth.uid() = id`); `Users update own profile` (update where `auth.uid() = id`). **No insert policy** — handled by trigger only.

### 2.2 `subscriptions`
- [ ] Columns: `id`, `user_id`, `razorpay_subscription_id` (unique), `razorpay_plan_id`, `plan`, `status` (`created|active|halted|cancelled`), `current_period_start`, `current_period_end`, `created_at`, `updated_at`.
- [ ] Indexes: `(user_id)`, `(razorpay_subscription_id)`.
- [ ] RLS: `Users read own subscription` only. **No client writes** — webhook uses service role.
- [ ] Decision: enforce **one active subscription per user** with a partial unique index on `user_id where status = 'active'`. (Spec implies it; doesn't enforce.)

### 2.3 `templates`
- [ ] Columns: `id` (text, e.g. `festival_bright_01`), `name`, `category` (`sale|showcase|trust|urgency`), `formats` (text[]), `preview_url`, `config` (jsonb — Fabric template), `is_active`, `created_at`.
- [ ] RLS: `Public read templates` (select where `true`).
- [ ] Phase 2 scaffold columns: `is_video boolean default false`, `creatomate_template_id text`. Add now in migration 007.
- [ ] Seed via `client/supabase/seed.sql` AND `lib/templates/configs/*.ts`. Seed at least one template per category × per supported format.

### 2.4 `generations`
- [ ] Columns: `id`, `user_id`, `input_type` (`url|photo`), `input_url`, `product_image_url`, `bg_removed_url`, `product_name`, `product_desc`, `language` (`en|hi|ta|te`), `template_id`, `format` (`1x1|9x16|4x5`), `copy_variants` (jsonb), `selected_variant int default 0`, `status` (`pending|processing|complete|failed`), `error_message`, `created_at`.
- [ ] Indexes: `(user_id, created_at desc)`, `(status)`.
- [ ] RLS: `Users manage own generations` (`for all using auth.uid() = user_id`).
- [ ] Decision: **storage of final exported PNG** is client-only (download direct). If we later need a "share link", add `final_url` column and persist to R2 bucket `adcreator-public`.

### 2.5 `copy_cache`
- [ ] Columns: `id`, `category`, `language`, `tone`, `variants` (jsonb), `use_count`, `created_at`.
- [ ] Index: `(category, language, tone)`.
- [ ] RLS: enabled with **no client policies** — service role only.
- [ ] SQL function: `increment_copy_cache_use(cache_id uuid)`.
- [ ] TODO: define category taxonomy (`fashion | food | electronics | beauty | home`) and tone taxonomy (`festive | urgent | trust | showcase`). Document in `lib/types.ts`.

### 2.6 `image_cache` (own design — spec mentions but doesn't DDL)
- [ ] Columns: `phash text primary key`, `bg_removed_url text not null`, `created_at timestamptz default now()`, `hit_count int default 0`, `original_size_bytes int`.
- [ ] RLS: enabled, **no client policies** — service role only.
- [ ] Eviction: nightly job (cron via Supabase pg_cron or Vercel Cron) deleting rows with `hit_count = 0` older than 30 days. Avoids unbounded growth.

### 2.7 Phase 2 scaffolds (create now, leave unused)
- [ ] `whatsapp_sessions` (phone PK, user FK, step, language, format, input_image_url, last_activity).
- [ ] `brand_kits` (id, user_id, name, logo_url, primary_color, secondary_color, font_family). RLS: own only.
- [ ] Migration 007 adds `templates.is_video`, `templates.creatomate_template_id`.

### 2.8 RLS verification
- [ ] Write a `pnpm test:rls` script that connects with the anon key as a fake user and asserts:
  - cannot read another user's profile, subscription, generation
  - cannot insert into `copy_cache` or `image_cache`
  - **can** read templates table
  - cannot escalate `plan` column on own profile (validate via update test)

### 2.9 Backups & migrations
- [ ] Use Supabase CLI (`supabase db push`) for every migration — **never** dashboard SQL editor.
- [ ] Keep linked project (`supabase link`) and check the migration into VCS before running on prod.
- [ ] Daily Supabase point-in-time backups: enabled by default on free tier (verify).

---

## 3. Supabase Configuration

### 3.1 Auth
- [ ] Enable **Google OAuth** with credentials from Google Cloud Console (OAuth 2.0 client ID).
  - Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`.
  - Configure consent screen (app name, logo, support email, scopes: email + profile).
- [ ] **Email/password** stays on by default. **Disable email confirmation** for MVP friction (Auth → Email → off).
  - Decision tracked: re-enable email confirmation after we ship abuse controls (Phase 2).
- [ ] **Site URL:** `https://adcreator.in`. **Additional redirect URLs:** `http://localhost:3000`, Vercel preview wildcard `https://*.vercel.app` for PR previews.
- [ ] **Password rules:** min length 8, require number + symbol (Supabase Auth → Password Policy).
- [ ] **Rate limits:** Supabase Auth defaults to 30 emails/hour on free tier — fine for MVP.
- [ ] 🔒 **Forgot password flow:** `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/reset' })` + `/auth/reset` page that calls `updateUser({ password })`.
- [ ] **Magic link** off for MVP (avoids confusion with two auth modalities).

### 3.2 Clients
- [ ] `lib/supabase/client.ts` — `createBrowserClient` for client components.
- [ ] `lib/supabase/server.ts` — `createServerClient` reading from `cookies()` (App Router).
- [ ] `lib/supabase/admin.ts` — `createClient` with `SUPABASE_SERVICE_ROLE_KEY`. **NEVER imported in any file under `app/(dashboard)`, `components/`, or any Client Component.** Add an ESLint rule (`no-restricted-imports`) to enforce this.
- [ ] All three exposed as functions, not module singletons (cookie store must be re-read per request).

### 3.3 Middleware (`middleware.ts`)
- [ ] Refresh session cookie on every request via `getSession()`.
- [ ] `matcher: ['/dashboard/:path*', '/api/generate/:path*', '/api/payments/:path*', '/api/upload/:path*', '/api/generations/:path*']`.
- [ ] Unauthenticated → redirect to `/login?next=<orig>`.
- [ ] Cookie chunking handled by `@supabase/ssr` (works automatically; spec relies on it).

### 3.4 Realtime (optional)
- [ ] Decision: not needed for MVP — generation completes inside the request lifecycle. Skip Realtime channels until WhatsApp bot or background queue arrives.

### 3.5 Storage buckets
- [ ] We **do not** use Supabase Storage. All file storage goes to R2. Verify no code imports `supabase.storage`.

---

## 4. Cloudflare R2

### 4.1 Buckets
- [ ] `adcreator-uploads` — raw user uploads. **Private**. PUT via presigned URL only.
- [ ] `adcreator-processed` — BG-removed transparent PNGs. **Private**. Read via presigned GET URL OR served via the public CDN domain (decide: spec uses `https://assets.adcreator.in/...` which implies public read via custom domain).
- [ ] `adcreator-public` — template previews, watermark assets, branding. **Public read** via Cloudflare CDN.
- [ ] Decision: For MVP, route `adcreator-processed` through the same public CDN domain because the URLs are unguessable (`bgr-{uuid}.png`); document this risk in security notes.

### 4.2 Custom domain & CDN
- [ ] Connect `adcreator-public` (and possibly `adcreator-processed`) to custom domain `assets.adcreator.in` in R2 dashboard.
- [ ] Cloudflare Cache Rule: match `assets.adcreator.in/*` → **Cache Everything**, edge TTL **7 days**, browser TTL **1 day**.
- [ ] Verify cache hit rates after launch via Cloudflare Analytics.

### 4.3 CORS (R2)
- [ ] Allowed origins: `https://adcreator.in`, `http://localhost:3000`, Vercel preview wildcard.
- [ ] Allowed methods: `GET`, `PUT`, `HEAD`.
- [ ] Allowed headers: `*`. Expose: `ETag`. Max age: 3600.

### 4.4 R2 client (`lib/r2/client.ts`)
- [ ] `S3Client` with `region: 'auto'`, endpoint `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`.
- [ ] Helpers: `uploadToR2(buffer, key, contentType, bucket?)`, `presignPut(key, contentType, expiresIn=300)`, `publicUrl(key)`.
- [ ] Key conventions (`lib/r2/keys.ts`):
  - User uploads: `uploads/{userId}/{uuid}.{ext}`
  - Processed: `processed/bgr-{uuid}.png`
  - Final exports (Phase 2): `exports/{userId}/{generationId}.png`

### 4.5 Lifecycle
- [ ] R2 lifecycle rule: delete objects in `adcreator-uploads` after 30 days (raw uploads are not needed long-term).
- [ ] Decide retention for `adcreator-processed` — 90 days default, longer for paid users (Phase 2).

---

## 5. File Upload Pipeline

### 5.1 Presigned URL flow (`POST /api/upload/presign`)
- [ ] Validate Supabase session — 401 if absent.
- [ ] Validate `size <= 10 MB` (spec) and `contentType.startsWith('image/')`.
- [ ] Validate `contentType` is in allowlist `['image/jpeg','image/png','image/webp']` — reject HEIC/AVIF (Fabric.js doesn't render reliably).
- [ ] Generate key: `uploads/{userId}/{crypto.randomUUID()}.{ext}` — sanitise `ext` (lowercase, alphanumeric only).
- [ ] `getSignedUrl(r2, PutObjectCommand, { expiresIn: 300 })`.
- [ ] Return `{ presignedUrl, key, publicUrl }`.

### 5.2 Client behaviour
- [ ] Drag-and-drop zone + file picker (shadcn/ui).
- [ ] Client-side preflight: image dimensions ≥ 400×400, ≤ 4096×4096 (warn, don't block).
- [ ] Show progress bar during PUT; retry once on network failure.
- [ ] On 200 from R2, kick off `POST /api/generate/extract` with the public URL.

### 5.3 Edge cases
- [ ] Expired presign (>5 min): client retries by re-fetching `/presign`.
- [ ] Wrong `Content-Type` header sent on PUT: R2 rejects — surface "upload failed" error.
- [ ] Concurrent uploads from same user: each gets its own UUID, no collision.

---

## 6. Product Info Extraction (`POST /api/generate/extract`)

### 6.1 URL path (Cheerio)
- [ ] Validate `inputUrl` is HTTPS, public hostname (block private IPs / metadata endpoints — 🔒 SSRF). Use `dns.lookup` + check against RFC1918, link-local, 169.254.169.254.
- [ ] Fetch with 5 s timeout, `User-Agent: AdCreatorBot/1.0`, max body 2 MB.
- [ ] Parse with Cheerio. Extract:
  - `og:title`, `og:description`, `og:image`, `<title>`, `<meta name="description">`, `<h1>`, JSON-LD `Product` schema (name, description, image, price, brand).
- [ ] Sanitise extracted strings with DOMPurify; collapse whitespace; truncate description to 500 chars.
- [ ] If `og:image` present and reachable, fetch and re-upload to R2 (don't hotlink at render time).

### 6.2 Photo path
- [ ] Use Groq Vision (`llama-3.2-90b-vision-preview` or current vision model — confirm at build time; spec says "Claude/Groq" — pick Groq to stay on one billing).
- [ ] Prompt: "Identify the product. Return JSON `{name, description, category}`." (`category` ∈ taxonomy.)
- [ ] Zod-validate output.
- [ ] Fallback: open a manual entry modal (`name`, `description`, `category`) if vision fails.

### 6.3 Edge cases
- [ ] URL returns HTML with no usable metadata → fallback to manual entry modal.
- [ ] URL returns non-HTML (PDF, JSON) → reject with "Unsupported page type".
- [ ] URL is from a marketplace requiring login (Amazon, Flipkart auth wall) → detect `noindex` / login redirect, prompt for manual entry. 🇮🇳 Many Indian D2C sellers paste Meesho/Shopify URLs — verify those scrape cleanly during smoke tests.
- [ ] Scrape returns adult/restricted content keywords (very basic blocklist) → reject before LLM call.

---

## 7. Background Removal (`POST /api/generate/bgremove`)

### 7.1 HuggingFace integration
- [ ] Model: `briaai/RMBG-1.4` via Serverless Inference.
- [ ] Use direct HTTP POST (`fetch`) — SDK has had issues with binary response handling.
- [ ] Send raw image bytes; receive a mask blob (or already-composited transparent PNG depending on model output — verify).
- [ ] Use **sharp** to combine the mask with the original image into a transparent PNG.

### 7.2 Retry & rate limit
- [ ] Up to **3 attempts** with exponential backoff.
  - 429 → `2000 * (attempt + 1)` ms wait.
  - 503 (model loading / cold start) → 5 s wait.
  - Other errors → don't retry, surface to user.
- [ ] Wrap each attempt in a 7 s `AbortController` so we don't blow the 10 s Vercel Hobby budget.

### 7.3 Perceptual hash cache (`image_cache` table)
- [ ] Compute pHash via `imghash` (or fallback SHA256 of 16×16 grayscale downscale).
- [ ] Lookup `image_cache.phash` first — if hit, return cached `bg_removed_url` and increment `hit_count`. **Skip HF entirely.**
- [ ] On miss, after successful HF call, insert row with `phash`, `bg_removed_url`, `original_size_bytes`.
- [ ] 💸 Cache reduces HF calls dramatically for recycled stock photos / popular SKUs.

### 7.4 Storage
- [ ] Upload result to R2 `adcreator-processed` bucket: key `processed/bgr-{uuid}.png`.
- [ ] Return `{ bgRemovedUrl, fromCache: boolean }`.

### 7.5 Edge cases
- [ ] HF returns model unavailable repeatedly → fallback to **passing through original image** with a banner: "background removal unavailable, using original image". Mark generation `status='complete'` with a flag `bg_remove_failed = true` (add column or stuff into a `meta` jsonb).
- [ ] Image larger than HF max payload (~10 MB): pre-resize via sharp to max 1600 px on long side before uploading to HF.
- [ ] Transparent input (already a PNG with alpha) → skip HF, return original.

---

## 8. Copy Generation (`POST /api/generate/copy`)

### 8.1 Groq client
- [ ] Model: `llama-3.3-70b-versatile`.
- [ ] `temperature: 0.8`, `max_tokens: 600`, `response_format: { type: 'json_object' }`.

### 8.2 Quota gate (FIRST thing in route)
- [ ] Call `checkAndIncrementQuota(userId)` from `lib/quota.ts`.
- [ ] If `!allowed`, return `403 { error: 'limit_exceeded', plan, limit }` for client-side upsell modal.
- [ ] **Decrement** the counter on subsequent failure (zod fail / Groq down) so users aren't charged a quota slot for a failed generation. Add `decrementQuota(userId)` and call in catch blocks.

### 8.3 Cache lookup (`copy_cache`)
- [ ] Key: `(category, language, tone)`.
- [ ] If hit, pick 3 random variants from `variants` array (pre-generated 5), return.
- [ ] Increment `use_count` via SQL function.

### 8.4 Prompts (`lib/groq/prompts.ts`)
- [ ] One system prompt per language. Copy verbatim from spec section 10:
  - **en** — punchy English, power words, benefit-focused, mention price.
  - **hi** — pure Devanagari, confident/warm/aspirational, family/savings/quality, wordplay+rhyme welcome. No Roman Hindi.
  - **ta** — Tamil script only, no Tanglish, strong/aspirational/community, urgent CTA.
  - **te** — Telugu script only, warm/trustworthy/family, urgent CTA.
- [ ] **Script enforcement assertion (post-validation):** for `hi/ta/te`, run a regex over the output that rejects strings containing >20% Latin characters. If fail → retry. Without this, llama occasionally lapses into English.
- [ ] User prompt template: includes product name, description, format (`1x1` = post, `9x16` = Reels/Story), tone.
- [ ] Hard schema requirement: `{"variants":[{headline,subheadline,cta} × 3]}`.

### 8.5 Validation (Zod)
- [ ] `CopyVariantSchema`: headline ≤ 60 chars, subheadline ≤ 120, cta ≤ 30.
- [ ] `CopyOutputSchema`: array length **exactly 3**.
- [ ] On Zod fail, retry up to **3 times** with the same prompt.
- [ ] After 3 fails: return `500 { error: 'copy_failed' }` and **decrement quota** (see 8.2).

### 8.6 Edge cases
- [ ] Groq returns markdown-fenced JSON despite `json_object` mode — strip ` ```json ... ``` ` defensively before `JSON.parse`.
- [ ] Mixed-script Hindi/Tamil/Telugu output → caught by 8.4 assertion.
- [ ] Profanity/abuse in user-provided product name flowing into copy → minimal MVP profanity filter (allowlist of categories blocked: weapons, drugs, adult). Use a small static word list.
- [ ] Groq down (5xx) → fallback to a hard-coded copy template per language ("Limited time offer — `${productName}` — Shop now"). Mark generation with `meta.fallback_copy = true`.
- [ ] Token budget exceeded (very long product description) → truncate description to 800 chars before prompt.

---

## 9. Template Engine (Fabric.js, client-side)

### 9.1 Template JSON schema (`lib/templates/types.ts`)
- [ ] Discriminated union `Layer`:
  - `rect` (x, y, w, h, fill, rx?)
  - `product` (x, y, w, h, shadow?) — placeholder for the BG-removed PNG
  - `text` (key: 'headline'|'subheadline'|'cta', x, y, maxWidth, fontSize, fontFamily, fill, fontWeight?, textAlign?)
  - `cta_btn` (x, y, w, h, fill, textFill, rx)
  - `logo` (x, y, w, h)
- [ ] Top-level: `id`, `canvas: { width, height, background }`, `layers[]`.
- [ ] Add `format: '1x1'|'9x16'|'4x5'` so we can pick template per format.

### 9.2 Seed templates (minimum to ship)
- [ ] `festival_bright_01` (sale, 1080×1080) — orange/black, included in spec.
- [ ] `festival_bright_01_9x16` (sale, 1080×1920) — same brand, vertical.
- [ ] `festival_bright_01_4x5` (sale, 1080×1350).
- [ ] `clean_minimal_01` (showcase) × 3 formats.
- [ ] `trust_badge_01` (trust) × 3 formats.
- [ ] `urgency_red_01` (urgency) × 3 formats.
- [ ] At least **12 templates** at launch (4 categories × 3 formats).
- [ ] Each template config double-tested for layer overflow at all 4 languages (Devanagari/Tamil/Telugu run wider than Latin).

### 9.3 Font loading (CORS-safe proxy)
- [ ] `GET /api/fonts/[family]` — fetches Google Fonts CSS and rewrites `https://fonts.gstatic.com/...` URLs to `/api/fontfile/...`.
- [ ] `GET /api/fontfile/[...path]` — proxies the actual `.woff2`, sets `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=31536000`.
- [ ] Family map covers `noto-sans`, `noto-sans-devanagari`, `noto-sans-tamil`, `noto-sans-telugu` at weights 400/700.
- [ ] Self-hosted fallback in `public/fonts/` so a Google outage doesn't break us.
- [ ] **Critical assertion**: `canvas.toDataURL()` must succeed in all 4 languages. Add Playwright test that downloads each language's preview and asserts it's a valid PNG.

### 9.4 Renderer (`components/canvas/FabricCanvas.tsx`)
- [ ] Initialise `fabric.Canvas` with `selection: false` (read-only preview).
- [ ] Effect on `[template, productImageUrl, copyVariant, language]` → `renderTemplate(...)`.
- [ ] `renderTemplate` clears, sets background, **awaits font load** (FontFace API), then paints layers in order.
- [ ] `fabric.Textbox` with `splitByGrapheme: true` — required for Devanagari conjuncts / Tamil/Telugu clusters.
- [ ] `loadFabricImage(url)` returns a `fabric.Image` from the proxied/transparent PNG. Set `crossOrigin: 'anonymous'` on the image element.
- [ ] Watermark overlay if `userPlan === 'free'` (see Section 14.4).
- [ ] Dispose canvas in unmount cleanup to avoid memory leaks across navigations.

### 9.5 Format switcher
- [ ] Switching format reloads the matching template variant (`templateId` + `format`) without re-running BG removal/copy generation. Cache results in Zustand.

### 9.6 Variant picker
- [ ] Three copy variants shown as cards; click swaps `copyVariant` and re-renders.

### 9.7 Download
- [ ] `canvas.toDataURL({ format: 'png', multiplier: 1, quality: 1 })`.
- [ ] Free tier: also offer "Download HD" button gated by upgrade modal.
- [ ] Filename: `adcreator-{templateId}-{Date.now()}.png`.

### 9.8 Edge cases
- [ ] Long Hindi headline overflows: enable text auto-fit (binary-search font size from configured down to 24 pt).
- [ ] Product PNG has odd aspect ratio: `scaleToFit(layerW, layerH)` and centre.
- [ ] Browser without OffscreenCanvas: fall back to standard canvas (Fabric handles this).

---

## 10. End-to-End Generation Orchestration

### 10.1 Client orchestrator
- [ ] Step 1 — upload (presign + PUT to R2).
- [ ] Step 2 — `extract` (Cheerio or vision).
- [ ] Step 3 — **Promise.all** of `bgremove` and `copy`.
- [ ] Step 4 — write a `generations` row (`status='complete'`) via internal API or directly with Supabase JS (RLS-safe).
- [ ] Step 5 — render Fabric preview.
- [ ] Step 6 — user picks variant, downloads.

### 10.2 Progress UI
- [ ] Stepper component showing the 6 steps with per-step state (pending/running/done/failed).
- [ ] Cancel button only valid pre-step-3 (after parallel calls fire, let them finish to keep state consistent).

### 10.3 Failure recovery
- [ ] Retry button reuses the same `product_image_url` to skip re-upload.
- [ ] On any 5xx mid-flight, write a `generations` row with `status='failed'` + `error_message`.
- [ ] Sentry captures the error with `userId`, `generationId`, `step`, sanitised inputs (no PII beyond product info).

### 10.4 Timing budget
- [ ] Target wall-clock ≤ 10 s on Vercel Hobby; ≤ 6 s p50 on Pro.
- [ ] Add server timing headers (`Server-Timing: bgremove;dur=...`) for observability.

---

## 11. API Routes — Full Inventory & Contracts

For each route: define request/response Zod schemas in `lib/schemas/*.ts`, share types between client & server.

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/upload/presign` | POST | ✓ | body `{filename, contentType, size}` → `{presignedUrl, key, publicUrl}` |
| `/api/generate/extract` | POST | ✓ | body `{inputType, inputUrl?, imageKey?}` → `{productName, productDesc, category, productImageUrl}` |
| `/api/generate/bgremove` | POST | ✓ | body `{imageUrl}` → `{bgRemovedUrl, fromCache}` |
| `/api/generate/copy` | POST | ✓ + Turnstile 🔒 | body `{productName, productDesc, language, tone, format, category, turnstileToken}` → `{variants:[3]}` or `403 limit_exceeded` |
| `/api/templates` | GET | – | `?format=1x1&category=sale` filter |
| `/api/generations` | GET | ✓ | `?cursor=...&limit=20` paginated list |
| `/api/generations/[id]` | GET | ✓ | RLS enforces ownership |
| `/api/payments/create-order` | POST | ✓ | body `{plan, billingCycle: 'monthly'|'annual'}` → `{subscriptionId}` |
| `/api/payments/webhook` | POST | sig | verify HMAC, switch on event |
| `/api/payments/cancel` | POST | ✓ | cancels Razorpay subscription at period end |
| `/api/fonts/[family]` | GET | – | proxies Google CSS |
| `/api/fontfile/[...path]` | GET | – | proxies font binary, 1y cache |
| `/api/turnstile/verify` | POST | – | siteverify with Cloudflare |

### 11.1 Common
- [ ] All POST routes parse JSON via Zod; reject 400 on malformed body.
- [ ] All routes set `Cache-Control: no-store` except font proxies.
- [ ] All errors returned as `{ error: code, message?, meta? }` for predictable client handling.
- [ ] Add request ID middleware (UUID per request, echoed in responses + Sentry).

### 11.2 Quota helper (`lib/quota.ts`)
- [ ] `PLAN_LIMITS = { free: 5, starter: 50, pro: 200, agency: Infinity }`.
- [ ] Reset window: 30 days from `monthly_reset_at` (calendar-month is simpler — decide and document; spec uses "30 days from").
- [ ] `checkAndIncrementQuota(userId)` returns `{ allowed, remaining }` — uses **admin client** (bypass RLS).
- [ ] Race conditions: wrap update in a single SQL `update ... set generation_count = generation_count + 1 where ... and generation_count < limit returning ...` to avoid double-spend on parallel generations.
- [ ] `decrementQuota(userId)` for failed generations (compensating action).

### 11.3 Auth middleware shape
- [ ] Helper `requireSession(req)` → returns `{ session, supabase }` or throws `Response.json({error:'unauthorized'},{status:401})`.
- [ ] Helper `requireTurnstile(req, token)` → `403` on fail.

---

## 12. Razorpay Payment Integration 🇮🇳 💸

### 12.1 Plans
- [ ] Create Razorpay plans (monthly + annual at 10× monthly):
  - Starter ₹499 / mo and ₹4,990 / yr.
  - Pro ₹1,199 / mo and ₹11,990 / yr.
  - Agency ₹2,999 / mo and ₹29,990 / yr.
- [ ] Store plan IDs in env vars (`RAZORPAY_PLAN_STARTER`, `..._PRO`, `..._AGENCY`, plus `_ANNUAL` variants).
- [ ] Free plan needs no Razorpay artefacts.

### 12.2 Order/subscription creation (`POST /api/payments/create-order`)
- [ ] Map `plan` + `billingCycle` to Razorpay `plan_id`.
- [ ] `total_count`: 12 for monthly (12 cycles), 1 for annual (single charge then renewal).
- [ ] Customer creation: if `profiles.razorpay_customer_id` is null, create Razorpay customer first (`razorpay.customers.create`) and persist.
- [ ] Upsert into `subscriptions` with `status='created'`.
- [ ] Return `{ subscriptionId, keyId }` so client can open Checkout.

### 12.3 Client checkout
- [ ] Load Razorpay Checkout `<script src="https://checkout.razorpay.com/v1/checkout.js" />` in the billing page only.
- [ ] Open `new Razorpay({ key, subscription_id, name: 'AdCreator', description, prefill, theme })`.
- [ ] On `handler` success → `router.push('/billing/success')`; on `modal.ondismiss` → toast.
- [ ] **Don't trust the client-side success handler for granting access.** Webhook is source of truth.

### 12.4 Webhook (`POST /api/payments/webhook`) 🔒
- [ ] Compute `HMAC-SHA256(body, RAZORPAY_WEBHOOK_SECRET)` and compare to `x-razorpay-signature`. Constant-time compare (`crypto.timingSafeEqual`).
- [ ] Read raw body via `await req.text()` BEFORE parsing — must hash exact bytes.
- [ ] Idempotency: store `event.id` in a `webhook_events` table; ignore duplicates.
- [ ] Handlers:
  - `subscription.activated` → set `subscriptions.status='active'`, set `profiles.plan=<mapped>`.
  - `subscription.charged` → update `current_period_start/end`. Reset `profiles.generation_count = 0` and `monthly_reset_at = now()` on each successful charge so quota cycles align with billing.
  - `subscription.cancelled` → set `subscriptions.status='cancelled'`, downgrade `profiles.plan='free'` at `current_period_end` (don't downgrade immediately — they paid through the period).
  - `subscription.halted` → set `status='halted'`, send email via Resend, downgrade after 7-day grace.
  - `payment.failed` → email user with retry link.
- [ ] `subscription.completed` (final cycle) — also downgrade.
- [ ] All handlers run with admin client.

### 12.5 Cancel (`POST /api/payments/cancel`)
- [ ] Server calls `razorpay.subscriptions.cancel(subscriptionId, false)` — `false` = cancel at period end.
- [ ] User remains on paid plan until `current_period_end`; webhook downgrades.

### 12.6 Plan gating
- [ ] Middleware/utility `requirePlan(min: Plan)` for routes that need paid tier.
- [ ] Watermark + format restriction for free tier (see Section 14).

### 12.7 Edge cases
- [ ] Webhook arrives before client redirect → success page shows "Activating your plan…" and polls `/api/profile` until plan flips. Add a 10 s timeout fallback message.
- [ ] User upgrades while on active sub → cancel old sub at period end, create new immediately, prorate (Razorpay doesn't auto-prorate subscriptions; document this — start new plan after current period).
- [ ] Razorpay test mode keys for dev (`rzp_test_*`); live keys only in Vercel Production env.
- [ ] GST handling: Razorpay collects GST automatically if business is GST-registered. Add GSTIN field in Razorpay dashboard.
- [ ] **Refund policy page** required by Razorpay onboarding — `legal/refund/page.tsx` must be live before going live.

---

## 13. Cloudflare Turnstile (Bot Protection)

- [ ] Create Turnstile site in Cloudflare dashboard. Mode: **Managed** (invisible by default, challenge if suspicious).
- [ ] Widget on `/signup` and gating button on `/api/generate/copy` (the cost driver).
- [ ] `<Turnstile siteKey={...} onSuccess={setToken} />` from `@marsidev/react-turnstile`.
- [ ] Server verify via `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response`, `remoteip` (`CF-Connecting-IP` header).
- [ ] On dev, use Cloudflare-provided test keys (always-pass / always-fail) so we can exercise both branches.

---

## 14. Pricing Plans & Access Control

| Plan | Price | Gens/mo | Languages | Formats | Features |
|---|---|---|---|---|---|
| Free | ₹0 | 5 | en, hi | 1×1 | Watermark; upgrade modal at limit |
| Starter | ₹499/mo | 50 | all 4 | all 3 | No watermark, HD, all templates |
| Pro | ₹1,199/mo | 200 | all 4 | all 3 | + Brand kit (Phase 2), priority |
| Agency | ₹2,999/mo | unlimited | all 4 | all 3 | + API access (Phase 2), bulk |

### 14.1 Enforcement
- [ ] Quota checked server-side in `/api/generate/copy` (single source of truth).
- [ ] Language gate: free tier UI hides Tamil/Telugu pickers; server returns 403 if requested.
- [ ] Format gate: free tier sees only 1×1; server validates `format`.
- [ ] Watermark applied client-side based on `profile.plan === 'free'` AND server-side check on rendered preview URL is irrelevant (we don't store the final image).

### 14.2 UsageBadge component
- [ ] Header shows `${used}/${limit} this month` with a progress ring.
- [ ] At 80% used → toast nudge to upgrade.
- [ ] At 100% → Generate button disables, click opens `PlanModal`.

### 14.3 PlanModal
- [ ] Three-card comparison (Starter / Pro / Agency).
- [ ] Toggle Monthly / Annual (10× = 2 months free badge).
- [ ] Click → `/api/payments/create-order` → Razorpay Checkout.

### 14.4 Watermark
- [ ] `fabric.Text('adcreator.in', { left: w-20, top: h-20, fontSize:18, fill:'rgba(255,255,255,0.6)', originX:'right', originY:'bottom', shadow:'rgba(0,0,0,0.3) 0 0 4' })`.
- [ ] Selectable: false. Last-added so it's always on top.

---

## 15. Pages & Screens (every screen the user can hit)

### 15.1 Marketing / Public
- [ ] `/` — Hero, language picker preview, sample ads, pricing CTA, testimonials placeholder. SSR for SEO.
- [ ] `/pricing` — full pricing table with FAQ.
- [ ] `/templates` — public gallery filtered by category/format.
- [ ] `/legal/terms`, `/legal/privacy`, `/legal/refund`, `/legal/shipping` (Razorpay India onboarding asks for these even for digital goods — add `shipping/page.tsx` saying "digital service, no shipping").

### 15.2 Auth
- [ ] `/login` — email/password + Google OAuth, "Forgot password?".
- [ ] `/signup` — email/password + Google + Turnstile.
- [ ] `/auth/callback` — App Router route to exchange code for session and set cookie.
- [ ] `/auth/forgot` — request reset email.
- [ ] `/auth/reset` — set new password (tokenised redirect from Supabase email).

### 15.3 Dashboard
- [ ] `/dashboard` — main generation flow.
  - Step 0: input (URL or photo upload).
  - Step 1: extracted product preview + manual edit.
  - Step 2: language + tone + format + template picker.
  - Step 3: live preview with copy variant tabs.
  - Step 4: download + share + "save to history".
- [ ] `/history` — paginated list of past generations (thumbnail, language, date, status).
- [ ] `/history/[id]` — view past generation, re-download, "remix" button (clones to `/dashboard` with prefilled data).
- [ ] `/billing` — current plan, usage, change plan, cancel.
- [ ] `/billing/success` — post-checkout confirmation (polls profile).
- [ ] `/settings` — profile (full name, avatar), email, password reset, delete account.

### 15.4 System / utility
- [ ] `/404` custom Not Found.
- [ ] `/500` custom error boundary.
- [x] `/offline` fallback shipped alongside the PWA service worker — see Recent additions.

### 15.5 Modals
- [ ] PlanModal (upsell at limit / on locked feature click).
- [ ] ManualEntryModal (extract failed).
- [ ] ConfirmDeleteModal (account deletion).
- [ ] CancelSubscriptionModal.

### 15.6 Empty / loading / error states for each page
- [ ] History empty: "No generations yet — make your first ad."
- [ ] Templates empty: should never happen (we seed); show "Loading templates" spinner only.
- [ ] Billing while no subscription: show plan picker.
- [ ] Generic error boundary on every page (Sentry-wrapped).

---

## 16. State & Data

### 16.1 React Query
- [ ] One QueryClient per app.
- [ ] Queries: `useTemplates()`, `useGenerations(cursor)`, `useGeneration(id)`, `useProfile()`.
- [ ] Mutations: `useUpload()`, `useExtract()`, `useBgRemove()`, `useCopy()`, `useCreateOrder()`, `useCancelSubscription()`.
- [ ] Invalidate `['profile']` after every successful generation (counter changed).

### 16.2 Zustand
- [ ] Store: `inputType`, `productImageUrl`, `bgRemovedUrl`, `productName`, `productDesc`, `category`, `language`, `tone`, `format`, `templateId`, `copyVariants[]`, `selectedVariantIndex`.
- [ ] Persist to `sessionStorage` so a refresh mid-flow doesn't lose work.

---

## 17. Email (Resend + React Email)

- [ ] Templates:
  - Welcome (post-signup).
  - Generation milestone (5th, 50th).
  - Subscription activated.
  - Subscription charged (receipt) — required by Razorpay/RBI.
  - Subscription failed payment — retry CTA.
  - Subscription cancelled.
  - Account deletion confirmation.
- [ ] Sender: `noreply@adcreator.in`. Configure SPF/DKIM in Cloudflare DNS per Resend instructions.
- [ ] Email Routing in Cloudflare to forward `support@adcreator.in` to founder inbox.

---

## 18. Analytics (PostHog)

- [ ] Events: `signup`, `login`, `upload_started`, `upload_completed`, `extract_succeeded/failed`, `bgremove_succeeded/failed`, `copy_generated`, `template_selected`, `variant_selected`, `download_clicked`, `upgrade_modal_shown`, `checkout_started`, `subscription_activated`, `subscription_cancelled`.
- [ ] Identify on login: `posthog.identify(user.id, { email, plan })`.
- [ ] Funnels: signup → first generation, free → paid.
- [ ] Session recording on for paying users only (PII consideration).

---

## 19. Errors (Sentry)

- [ ] `@sentry/nextjs` wizard run.
- [ ] Capture API errors in route handlers via try/catch.
- [ ] Tag with `route`, `userId`, `plan`, `requestId`.
- [ ] Filter PII (`beforeSend` strips emails from extra data).
- [ ] Source maps uploaded on Vercel build.

---

## 20. Environment Variables (full list)

Required in `.env.local`, Vercel Production, Vercel Preview, and (subset) Vercel Development.

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 🔒
- [ ] `GROQ_API_KEY` 🔒
- [ ] `HUGGINGFACE_TOKEN` 🔒
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `R2_ACCESS_KEY_ID` 🔒
- [ ] `R2_SECRET_ACCESS_KEY` 🔒
- [ ] `R2_PUBLIC_BASE` (e.g. `https://assets.adcreator.in`)
- [ ] `R2_BUCKET_UPLOADS`, `R2_BUCKET_PROCESSED`, `R2_BUCKET_PUBLIC` (so we don't hard-code names)
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET` 🔒
- [ ] `RAZORPAY_WEBHOOK_SECRET` 🔒
- [ ] `RAZORPAY_PLAN_STARTER`, `RAZORPAY_PLAN_PRO`, `RAZORPAY_PLAN_AGENCY` (+ `_ANNUAL` variants)
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- [ ] `TURNSTILE_SECRET_KEY` 🔒
- [ ] `RESEND_API_KEY` 🔒
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com` or EU/India host)
- [ ] `SENTRY_DSN` (server)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (client)
- [ ] `SENTRY_AUTH_TOKEN` 🔒 (build-time, source maps)
- [ ] `NEXT_PUBLIC_APP_URL` (e.g. `https://adcreator.in`)

Add `lib/env.ts` that runs Zod validation on startup so a missing var crashes the build, not the first request.

---

## 21. Security Checklist 🔒

- [ ] All secrets only in server contexts (no `NEXT_PUBLIC_*` for keys).
- [ ] Service role key never imported in client code (lint rule).
- [ ] HMAC verify on Razorpay webhook (constant-time compare).
- [ ] Turnstile on signup + copy generation.
- [ ] SSRF guard in URL extractor.
- [ ] File type allowlist on upload.
- [ ] Size cap on upload (10 MB) and HF input (16 MB sharp pre-resize).
- [ ] RLS on every table; service role only for cache/webhook tables.
- [ ] Sanitise scraped HTML before storing.
- [x] CSP headers — full set in `lib/security/csp.ts`: script-src self + Razorpay + Turnstile + PostHog + Vercel; img-src self+data+blob+R2+Supabase; connect-src self + Sentry/PostHog/Supabase(wss)/Razorpay; frame-src Razorpay+Turnstile; object-src none; frame-ancestors none. Plus X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy. 8 vitest cases + 3 Playwright specs verify headers reach browser AND no CSP violations on /dashboard or /templates. `unsafe-inline` on script-src documented + tracked for nonce refactor. Landed `0bd6c77`.
- [ ] HSTS via Vercel default; verify after domain mapping.
- [ ] Cookie flags (`SameSite=Lax`, `Secure`, `HttpOnly`) — handled by `@supabase/ssr`.
- [ ] Rate limit `/api/generate/extract` per user (5/min) via Vercel KV or in-memory if low scale.
- [ ] Account deletion → cascades remove generations; explicitly delete R2 objects under `uploads/{userId}/`.
- [ ] DPDP Act compliance (India): data deletion within 30 days of request; privacy policy mentions third-party sub-processors (Groq, HF, Razorpay, Cloudflare, Supabase, Resend, Sentry, PostHog).

---

## 22. Performance Budget

- [ ] LCP < 2.5 s on 4G mobile (India median).
- [ ] Initial JS < 180 kB gzip.
- [ ] Generation wall-clock p50 < 8 s, p95 < 14 s.
- [ ] Fabric canvas first paint < 500 ms after copy + bg URLs arrive.
- [ ] R2 CDN cache hit ≥ 80% on `assets.adcreator.in`.

---

## 23. Testing Strategy

### 23.1 Unit (Vitest)
- [ ] Zod schemas (positive + negative).
- [ ] Quota math (period rollover, race conditions).
- [ ] Razorpay HMAC verifier.
- [ ] R2 key generator (collisions / sanitisation).
- [ ] Cheerio extractor on fixture HTML (Shopify, Meesho, generic).
- [ ] Script-purity assertion for hi/ta/te outputs.

### 23.2 Integration (Vitest + MSW)
- [ ] `/api/generate/copy` happy path with mocked Groq.
- [ ] `/api/generate/copy` quota exceeded.
- [ ] `/api/generate/bgremove` retry on 503.
- [ ] `/api/payments/webhook` activated → plan change.
- [ ] Webhook idempotency.

### 23.3 E2E (Playwright)
- [ ] Signup (email) → first generation → download.
- [ ] Signup (Google OAuth via test mode).
- [ ] Hit free-tier limit → upgrade modal → Razorpay test card → plan upgraded.
- [ ] Each language renders without canvas-tainted error (assert PNG bytes returned).
- [ ] History list pagination.
- [ ] Cancel subscription → still works through period end.

### 23.4 Manual smoke (pre-launch)
- [ ] Real Razorpay test in INR sandbox with UPI / card.
- [ ] Real HuggingFace cold start path (first call after >24 h idle).
- [ ] Mobile Safari + Chrome Android render check.

---

## 24. Vercel Deployment

- [ ] Push to GitHub. Branch `main` = production.
- [ ] Vercel project: framework Next.js, root `client/`.
- [ ] Add all env vars (Section 20) for Production / Preview / Development.
- [ ] Custom domain `adcreator.in` via Cloudflare DNS (orange cloud ON).
- [ ] `next.config.mjs`:
  - `images.remotePatterns` allows `assets.adcreator.in` + `*.supabase.co`.
  - `serverExternalPackages: ['sharp']` (renamed from `experimental.serverComponentsExternalPackages` in Next 15+; we're on canary 16).
  - Enable the **Next.js MCP server** flag per the canary docs so dev-mode agents can introspect routes/logs.
- [ ] Function `maxDuration = 60` on `/api/generate/bgremove` and `/api/generate/copy` once Pro plan is active.
- [ ] Vercel Cron: nightly `image_cache` eviction (`/api/cron/evict-cache`).
- [ ] Vercel Cron: daily quota reset audit (catch any stale `monthly_reset_at`).
- [ ] Deploy hook from Supabase migrations CI.
- [ ] Preview deploys for every PR; Playwright smoke runs against preview.

---

## 25. Cost Monitoring 💸

- [ ] Track in PostHog dashboard: HF call count/day, Groq call count/day, R2 storage GB.
- [ ] Alert (Sentry / email): HF > 250 req/hr (approaching free limit) → consider Pro upgrade.
- [ ] Alert: Groq > 12,000 req/day.
- [ ] Monthly budget review: re-run section 19 (cost breakdown) sums vs actuals.

---

## 26. Phase 2 Hooks (scaffold only at MVP)

- [ ] `whatsapp_sessions` table created (Section 2.7).
- [ ] `brand_kits` table + RLS created.
- [ ] `templates.is_video`, `templates.creatomate_template_id` columns added.
- [ ] Generation orchestrator includes a `if (template.isVideo) return callCreatomate(...)` branch (no-op for MVP).
- [ ] `/api/whatsapp/webhook` route file with `// TODO Phase 2` placeholder.
- [ ] Brand kit upload flow in `/settings` hidden behind a feature flag.

---

## 27. Launch Checklist (T-minus)

### T-2 weeks
- [ ] All MVP features working in staging (Vercel preview).
- [ ] All Playwright tests green.
- [ ] Razorpay live keys requested (KYC submitted).
- [ ] Domain registered, DNS through Cloudflare.
- [ ] `pnpm mcp:doctor` green for every MCP listed in `.mcp.json`.
- [ ] AGENTS.md reviewed; project-specific rules section up to date with any new conventions added during build.

### T-1 week
- [ ] Razorpay live keys received + plans created in live mode.
- [ ] Webhook URL configured in Razorpay live dashboard with secret.
- [ ] Resend domain verified (SPF/DKIM/DMARC).
- [ ] Supabase production project upgraded if approaching free-tier DB limit.
- [ ] Sentry release tagged.
- [ ] PostHog production project keyed.
- [ ] Legal pages reviewed.
- [ ] Refund/cancel policies linked from footer + checkout.

### Launch day
- [ ] Flip Vercel to production deploy.
- [ ] Smoke test: signup → generate → upgrade → download → cancel.
- [ ] Monitor Sentry for first hour at 5-min intervals.
- [ ] Watch HF rate limits.

### T+1 week
- [ ] Review funnel (signup → first generation → upgrade) in PostHog.
- [ ] Triage any Sentry recurring errors.
- [ ] Decide on Vercel Pro upgrade based on observed function timeouts.
- [ ] Schedule cleanup task to remove watermark string if rebranding.

---

## 28. Open Questions / Decisions To Make

- [!] **Calendar month vs 30-day rolling** for quota reset — spec uses 30 days. UX-friendlier is calendar. Pick one and document.
- [!] **Where to host R2 region** — R2 doesn't expose region selection but custom domain via Cloudflare hides this; verify Mumbai/Chennai PoPs serve assets.
- [!] **Vision model for photo extraction** — Groq vision model name changes; freeze a model ID at build time and document fallback.
- [!] **`adcreator-processed` privacy** — public CDN with UUID URL vs presigned read URL per access. MVP picks public for simplicity.
- [!] **Email confirmation toggle** — disabled at MVP for friction; re-enable once we ship abuse handling.
- [!] **Profanity / restricted-product policy** — minimal blocklist now; document escalation path.
- [!] **GST invoice generation** — Razorpay handles for registered businesses; verify our entity setup before launch.

---

## Appendix A — Spec coverage map

| Spec section | TODO section |
|---|---|
| 1 Product Overview | header, 14, 15 |
| 2 Tech Stack | 0 |
| 3 System Architecture | 10 |
| 4 Repository Structure | 1 |
| 5 Database Schema | 2 |
| 6 Supabase Configuration | 3 |
| 7 Cloudflare R2 Setup | 4 |
| 8 File Upload Pipeline | 5 |
| 9 Background Removal | 7 |
| 10 Ad Copy Generation | 8 |
| 11 Template Engine | 9 |
| 12 End-to-End Generation Flow | 10 |
| 13 All API Routes | 11 |
| 14 Razorpay Integration | 12 |
| 15 Cloudflare Free Tier Usage | 4, 13 |
| 16 Pricing Plans & Access Control | 14 |
| 17 Environment Variables | 20 |
| 18 Vercel Deployment | 24 |
| 19 Cost Breakdown | 25 |
| 20 Phase 2 Hooks | 26 |

---

## Recent additions (post-Jun-2026 sweep — landed after the spec was written)

- [x] **Motion entrance choreography** — `lib/motion/entrance.ts` exports `fadeUp` / `fadeUpHero` / `staggerChildren` Apple-cadence variants. Wired into landing hero (eyebrow + h1 + sub + CTA stagger), dashboard preview card (fadeUpHero), auth login/signup cards. Honours `useReducedMotion` (initial:false → no animation when opted out). Landed `0a9691f`.
- [x] **Power-user keyboard shortcuts** — `lib/hooks/use-shortcuts.ts` with cmdk-style input-focus guard. Dashboard binds D (download), G (generate), 1/2/3 (switch variants). Visible kbd hint row under canvas card on lg+. 4 vitest cases. Landed `0a9691f`.
- [x] **Turnstile widget on /signup** — `components/auth/turnstile-gate.tsx` renders the @marsidev/react-turnstile widget when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set, falls back to a "dev-bypassed" pill when unset. Landed `a54b71b`.
- [x] **JSON-LD structured data on public pages** — `lib/seo/json-ld.tsx` exports typed builders (WebSite + Organization + Product + BreadcrumbList + ItemList of CreativeWork) and a `<JsonLd>` server component. Wired into `/`, `/pricing`, `/templates`. 5 vitest cases for the builders + 2 Playwright specs assert the script tags mount on the rendered HTML. Landed `da1f26e`.
- [x] **Per-language Open Graph variants** — `lib/og/render.tsx` shared `renderOg(language)` ImageResponse helper using per-language Noto woff2 fetched from gstatic at edge runtime so Indic glyphs actually render. Three new edge routes at `app/og/{hi,ta,te}/route.tsx`; root `opengraph-image.tsx` refactored to use the helper. Layout metadata enumerates all four images + `alternateLocale: ["hi_IN", "ta_IN", "te_IN"]`. 1 Playwright spec confirms `/og/hi` returns a 200 PNG. Landed `3341ff4`.
- [x] **PWA service worker + offline shell** — hand-written `public/sw.js` (no Serwist — needs webpack which is risky on canary). Cache-versioned: static `/_next/*` cache-first, fonts cache-first, HTML navigations network-first with `/offline` fallback, `/api/*` + `/auth/*` never cached. `components/pwa/sw-register.tsx` registers in production only on the `load` event. `components/pwa/install-prompt.tsx` captures Chrome's `beforeinstallprompt` + shows iOS Safari "Tap Share → Add to Home Screen" hint. `app/offline/page.tsx` renders the offline fallback. `next.config.ts` serves `/sw.js` with `Cache-Control: no-cache`, `Service-Worker-Allowed: /`. 3 vitest cases for the iOS/Chrome branch logic + 2 Playwright specs (sw.js headers + /offline page render). Landed `0983ed8`.
