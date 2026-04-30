# AdCreator

> AI ad creator for Indian small businesses. Drop a product photo, pick a language, get three studio-quality ad creatives in 30 seconds — copy written natively in Hindi, Tamil, Telugu, or English; background removed; composited onto a brand-perfect template.

| | |
|---|---|
| Stack | Next.js 16 (canary, App Router) · React 19 · Tailwind v4 · TypeScript strict · shadcn/ui (`base-nova` / Base UI) · Geist + Instrument Serif · Fabric.js · vitest · Biome |
| Backend | Supabase (Postgres + Auth + RLS) · Cloudflare R2 · Groq (llama-3.3-70b) · HuggingFace (RMBG-1.4) · Razorpay · Cloudflare Turnstile · Resend |
| Languages | English · हिन्दी · தமிழ் · తెలుగు |
| Live demo | _deployment pending_ |

---

## Repo layout

```
makemyadd/
├── client/               ← Next.js application (everything you cd into for daily work)
│   ├── app/              ← App Router routes (auth / marketing / dashboard / api)
│   ├── components/       ← UI primitives (ui/) + domain components (canvas/, generate/, billing/, command/)
│   ├── lib/              ← Server + client helpers (supabase/, r2/, groq/, hf/, razorpay/, …)
│   ├── supabase/         ← DB migrations, seed, supabase config.toml
│   ├── DESIGN.md         ← Design system source of truth (read before any UI work)
│   ├── biome.json        ← Lint/format (NOT eslint/prettier — Biome owns both)
│   ├── .env.example      ← Copy to .env.local
│   └── package.json
├── docs/                 ← Product spec PDF + extracted text
├── tools/mcp-doctor.mjs  ← Pings every MCP server in .mcp.json
├── .claude/skills/ui/    ← Project skill that auto-activates on UI work
├── AGENTS.md             ← Rules for AI coding agents (Claude / Cursor / Copilot)
├── CLAUDE.md             ← `@AGENTS.md` import for Claude Code
├── CONTRIBUTING.md       ← Branch strategy, commit style, PR checklist
├── TODO.md               ← Living build plan
└── .mcp.json             ← MCP server catalogue
```

---

## Prerequisites

- **Node.js 20+** (we use 24 in dev — anything ≥ 20.10 works)
- **pnpm 10+** (corepack-managed; do not use npm or yarn)
- **git**
- Optional for full stack: a Supabase project, Groq API key, HuggingFace token, Cloudflare R2 keys, Razorpay test keys

You can boot and click through the entire UI **without** any external creds — the dashboard runs the generation flow against a mock state machine, the canvas renders real Fabric.js previews, and 9 of 10 API routes return Zod-validated 501 stubs ready to be implemented when keys land.

---

## Quickstart

```bash
git clone git@github.com:DurgeshKr2242/makemyadd.git
cd makemyadd/client
pnpm install
cp .env.example .env.local      # all values can stay blank — they coerce to undefined
pnpm dev                        # http://localhost:3000
```

Then open:

| URL | Purpose |
|---|---|
| `/` | Marketing landing |
| `/dashboard` | Generation studio — drop a file, hit Generate, watch the 6-step stepper, swap variants |
| `/templates` | Real Fabric.js previews of all 10 templates |
| `/design` | Design system showcase — every token, type sample, primitive |
| `/pricing` | 4-plan grid (Free / Starter / Pro / Agency) |
| `/api/templates` | JSON list, filterable by `?format=` `?category=` |

Press `⌘K` (or `Ctrl+K`) anywhere for the command palette.

---

## Daily commands

All run from `client/`.

```bash
pnpm dev          # next dev (port 3000)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit (no emit, just types)
pnpm lint         # biome check
pnpm lint:fix     # biome check --write
pnpm format       # biome format --write
pnpm test         # vitest run
pnpm test:watch   # vitest in watch mode
pnpm test:coverage
pnpm mcp:doctor   # pings every MCP server in .mcp.json
```

---

## Environment variables

All env vars live in `client/.env.local` (gitignored). `client/.env.example` is the canonical reference. Empty / blank values are coerced to `undefined` by `client/lib/env.ts` and `lib/env.server.ts`, so you can leave anything unset until that integration is wired.

**Required to boot** (fall back to dev-mode placeholders if unset):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Server-only** (each unlocks the matching API route stub):

| Var | Unlocks |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | RLS-bypass paths (webhook, quota helpers) |
| `GROQ_API_KEY` | `/api/generate/copy`, `/api/generate/extract` (vision) |
| `HUGGINGFACE_TOKEN` | `/api/generate/bgremove` |
| `CLOUDFLARE_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` | `/api/upload/presign` and processed-image storage |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | `/api/payments/create-order`, `/api/payments/cancel` |
| `RAZORPAY_WEBHOOK_SECRET` | `/api/payments/webhook` (HMAC verify; route 503s without it — fail-closed) |
| `TURNSTILE_SECRET_KEY` | `/api/turnstile/verify` (already implemented; uses dev bypass without the key) |
| `RESEND_API_KEY` | Transactional email |
| `SENTRY_DSN` | Error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics |

See TODO.md §20 for the complete reference.

---

## Architecture in one paragraph

Single Next.js app. UI is dark-first Apple-cadence (Geist + Instrument Serif) with a saffron accent. Templates are typed JSON configs (`TemplateConfig`) stored in `client/lib/templates/configs/`. The renderer is **Fabric.js client-side only** — no server canvas. Google Fonts are proxied through `/api/fonts/[family]` + `/api/fontfile/[...path]` to avoid CORS taint on `canvas.toDataURL()`. Background removal calls HuggingFace's serverless `RMBG-1.4`, copy generation calls Groq `llama-3.3-70b-versatile` with one Zod-validated system prompt per language. Quota is gated server-side before the Groq call. Razorpay handles INR billing with HMAC-verified webhooks. Auth is Supabase with RLS on every user-facing table; the service-role client is `server-only`-guarded and Biome-restricted from any non-server code path.

---

## Working with AI agents

This repo is **agent-optimised**. Several files exist specifically to make agents (Claude Code, Cursor, Copilot, Gemini) produce good code without re-deriving conventions:

- **`AGENTS.md`** at the repo root — agents read this first. Lists the rules: no `npm install`, no `framer-motion` (use `motion/react`), no `<Button render={<Link/>}>` (use `<ButtonLink>`), HMAC verify with `timingSafeEqual`, never import the service-role client from client code, etc.
- **`CLAUDE.md`** — single-line `@AGENTS.md` import for Claude Code.
- **`client/DESIGN.md`** — design system source of truth. Read before any UI change.
- **`.claude/skills/ui/SKILL.md`** — auto-activates on UI requests, enforces DESIGN.md + frontend-design philosophy (no AI slop, distinctive typography, atmospheric backgrounds, BOLD aesthetic intent).
- **`.mcp.json`** — 11 MCP servers wired (Next.js, Supabase ×2, Cloudflare R2 + Observability, Vercel, Sentry, PostHog, GitHub, shadcn, Playwright). Run `pnpm mcp:doctor` from `client/` to verify reachability.
- **`client/node_modules/next/dist/docs/`** — Next.js docs version-matched to the installed canary, bundled with the package. AGENTS.md tells agents to read this instead of relying on potentially-outdated training data.

A scheduled remote agent runs every 8 hours, audits the repo for stalled 501 stubs, and reports the next-best candidate to wire. Manage at https://claude.ai/code/routines/trig_01LwtHEiA7tchDV4ZjmKmZob.

---

## Troubleshooting

### "Supabase env vars not set" on `pnpm dev`

The dashboard layout falls back to dev mode if `NEXT_PUBLIC_SUPABASE_URL` is empty. Look for `you@brand.in (dev mode)` in the account dropdown — that's expected. To wire real Supabase: create a project at supabase.com, paste the URL + anon key into `client/.env.local`, restart dev.

### Indic text appears as `□□□` on the canvas

The font proxy (`/api/fonts/[family]`) needs to load the correct Noto family for the selected language. If you see tofu, hit `/api/fonts/noto-sans-devanagari` directly in your browser — you should see CSS containing `/api/fontfile/...`. If that page 404s, the language slug isn't in `client/lib/fonts/families.ts`.

### Canvas overflowing the wrapper

Fabric.js writes `width: 1080px` inline styles that override Tailwind. We call `canvas.setDimensions({...}, { cssOnly: true })` after init to scale the CSS pixels while keeping the internal resolution at template-native (1080px exports stay crisp). If a new template renders at native size, that call is missing — see `client/components/canvas/FabricCanvas.tsx`.

### Razorpay test cards (sandbox)

| Card | Outcome |
|---|---|
| `4111 1111 1111 1111` | Success |
| `5104 0600 0000 0008` | Success (Mastercard) |
| `4012 0010 3852 1234` | Failure (insufficient funds) |
| UPI VPA `success@razorpay` | Success |
| UPI VPA `failure@razorpay` | Failure |

CVV: any 3 digits. Expiry: any future date. Never use real PAN / UPI / GST in fixtures or commit messages.

### HF cold start blowing the Vercel function timeout

Vercel Hobby has a 10s function timeout. HuggingFace's RMBG-1.4 endpoint can take 5–8s on cold start. We retry up to 3× with backoff in `lib/hf/bgremove.ts` (when implemented) and run the BG-remove + copy-gen in parallel via `Promise.all`. If you still time out, upgrade to Vercel Pro (60s) or move BG-remove to a dedicated worker.

### `pnpm mcp:doctor` shows servers DOWN

`nextjs` is expected DOWN until `pnpm dev` is running (it polls `localhost:3000/_next/mcp`). Anything else DOWN means the URL/token in `.mcp.json` needs updating — see the comment block in `.mcp.json` and AGENTS.md § "MCP usage".

---

## Deployment

We deploy to **Vercel**. Follow the Vercel-deployment notes in TODO.md §24. Short version:

1. Push `main` to the GitHub repo connected to the Vercel project.
2. Set every env var from `client/.env.example` in **Vercel → Settings → Environment Variables** for Production / Preview / Development.
3. Custom domain `adcreator.in` proxied through Cloudflare (orange cloud ON) for the CDN + Turnstile + R2 routing.
4. Vercel Cron: nightly `image_cache` eviction job + daily quota reset audit.

---

## License

Proprietary — all rights reserved. Internal project. Not for redistribution.

---

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR.
