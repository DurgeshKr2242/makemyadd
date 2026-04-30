<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `client/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# India AI Ad Creator — Project rules for AI agents

> The Next.js section above is auto-managed by `create-next-app`. **Do not edit between the BEGIN/END markers** — your changes will be overwritten on Next.js upgrades. Add project rules below this line.

## Where things live

- The Next.js application lives in `client/`. The `package.json`, `tsconfig.json`, `biome.json`, `next.config.ts`, and all source code are inside `client/`. Run pnpm/npx commands from `client/` unless the task is repo-wide (git, MCP).
- Bundled, version-matched Next.js docs: `client/node_modules/next/dist/docs/`. **Always read the relevant page from here before changing routing, data fetching, caching, middleware, or config.** Your training data on Next.js 16 is incomplete.
- Build plan / source of truth for product scope: `TODO.md` at the repo root. Tick boxes as work lands; do not delete unchecked items.
- Product spec (immutable): `docs/adcreator_technical_spec.pdf` (and the extracted text alongside). Quote the spec section number in PR descriptions when implementing a feature so reviewers can map back.
- **Design system source of truth: `client/DESIGN.md`.** Read it before any UI/UX work. Tokens, motion, density, accessibility, anti-patterns. The `.claude/skills/ui/SKILL.md` skill auto-activates on UI requests and enforces this doc — do not bypass it.

## Agent ecosystem

This file is the source of truth. The following mirrors point at it for agents that don't read AGENTS.md directly:

- **Claude Code**: `CLAUDE.md` (single-line `@AGENTS.md` import) + `.claude/skills/ui/SKILL.md` for UI work
- **Cursor**: `.cursor/rules/project.mdc` (always-apply rule that links here)
- **GitHub Copilot**: `.github/copilot-instructions.md` (auto-loaded on suggestions)
- **Gemini CLI / OpenCode / others**: read this file directly per the AGENTS.md convention

When you change a rule here, update the mirrors so the rule reaches every agent. The mirrors should stay short — link back to this file rather than duplicating long sections.

## Tooling

- Package manager: **pnpm** (corepack-managed; do not introduce `npm install` or `yarn`).
- Lint/format: **Biome** (`biome check --apply`). No ESLint or Prettier config — Biome owns both.
- Tailwind: **v4** with CSS-first config. There is no `tailwind.config.ts`; theme tokens live in `app/globals.css` via `@theme`.
- TypeScript: strict + `noUncheckedIndexedAccess`. Treat any `any` as a code-review failure.

## Database

- All schema changes go through **`client/supabase/migrations/*.sql`**. Never edit schema in the Supabase dashboard. Run the Supabase CLI from inside `client/` (where `package.json` and `.env.local` live).
- Regenerate types after every migration: `pnpm db:types`. Never hand-edit `client/lib/supabase/database.types.ts`.
- Use the **Supabase MCP** (`supabase-local` for read-write, `supabase-prod` for read-only) for schema lookups instead of guessing column names.
- Row-Level Security is enabled on every user-facing table. Service-role client (`lib/supabase/admin.ts`) is the only path that bypasses RLS — **never** import it from a Client Component or any file under `app/(dashboard)`. There is a Biome lint rule preventing this; if you see it fire, fix the import, do not silence the rule.

## Indic text rendering (critical)

- The product ships in English, Hindi (Devanagari), Tamil, and Telugu. Any change to `components/canvas/FabricCanvas.tsx`, the font-proxy routes (`app/api/fonts/*`, `app/api/fontfile/*`), or copy-generation prompts requires running the per-language Playwright snapshot test before merging.
- Do not load Google Fonts directly into the canvas — it taints the canvas and `toDataURL()` will throw. Always go through the font-proxy routes.

## Payments

- Razorpay test cards live in `README.md#troubleshooting`. Never put real PAN numbers, real UPI IDs, or live Razorpay keys in tests, fixtures, or commit messages.
- Webhook signature verification uses HMAC-SHA256 with constant-time comparison (`crypto.timingSafeEqual`). Do not "simplify" this with `===`.
- The webhook is the source of truth for plan changes. Do not grant access from the client-side checkout success handler.

## AI / external API calls

- Groq calls are quota-gated **before** the network call. If you add a new generation endpoint, reuse `lib/quota.ts` — do not roll your own counter.
- HuggingFace BG removal is rate-limited (~300/hr free). Always check `image_cache` (perceptual hash) before calling. Wrap calls in `AbortController` with a 7s budget so we do not blow Vercel's function timeout.
- LLM JSON outputs are validated by Zod **on every response**. If validation fails three times, surface `copy_failed` to the client and decrement the quota — do not store unvalidated copy.

## Security

- All secrets are server-only. `NEXT_PUBLIC_*` is for keys safe to ship to the browser; service role keys, Razorpay secrets, HuggingFace tokens, etc. must never get a `NEXT_PUBLIC_` prefix.
- URL extraction (`/api/generate/extract`) must reject private IPs, link-local, and the cloud metadata endpoint (169.254.169.254). SSRF is the easiest mistake to ship here.
- File uploads: contentType allowlist `image/jpeg|png|webp` only. 10 MB cap. HEIC/AVIF rejected — Fabric.js does not render them reliably.

## Commits & PRs

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Every PR must pass `pnpm typecheck`, `pnpm lint`, `pnpm test`, and produce a green Vercel preview before merging to `main`.
- When implementing from the spec, include the section number in the PR description (e.g. "Spec §10 — Copy generation").

## MCP usage

- Available servers are listed in `.mcp.json` at the repo root. Run `pnpm mcp:doctor` to confirm they are reachable before debugging — silent MCP failures send agents back to hallucinations.
- Prefer MCP tools over shell heuristics: e.g. use the Supabase MCP `list_tables` over `psql -c "\dt"`, use the Sentry MCP for issue lookup over `curl`-ing the API.
- Do not put auth tokens in `.mcp.json` directly — use `${VAR}` substitution and put values in your shell environment or `~/.config/claude/.env`.
