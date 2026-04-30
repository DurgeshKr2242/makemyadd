# Contributing

> **Read [`AGENTS.md`](./AGENTS.md) and [`client/DESIGN.md`](./client/DESIGN.md) before your first commit.** Both are short. They contain the constraints that prevent the codebase from drifting into "AI slop".

## Branching

- `main` — protected, deploys to production. Only fast-forward merges from feature branches.
- `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`, `refactor/<topic>` — feature branches. Match the conventional-commit prefix.
- One feature per branch. Don't pile unrelated work into the same PR.

## Commit messages — Conventional Commits

| Prefix | Use |
|---|---|
| `feat:` | New feature visible to end users |
| `fix:` | Bug fix |
| `chore:` | Tooling / dependency / scaffolding |
| `docs:` | Docs-only |
| `refactor:` | Code change that's not a bug or feature |
| `test:` | Test-only |
| `style:` | Pure formatting (rare — biome handles most of this) |
| `perf:` | Performance improvement |

Optional scope: `feat(canvas): …`, `fix(api): …`. Use it when the change is scoped to one area and the area name shows up elsewhere in the codebase (`canvas`, `api`, `fonts`, `templates`, `dashboard`, `marketing`, `auth`, `billing`).

Body: explain the **why**, not the **what** — the diff already shows the what. Cite the spec section if you're implementing from `docs/adcreator_technical_spec.pdf` (e.g. "Spec §10 — Copy generation").

Co-author trailer (auto-added when working with Claude / Cursor / Copilot):
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## PR checklist

Before you open a PR:

- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean (Biome — auto-fix with `pnpm lint:fix`)
- [ ] `pnpm test` clean (vitest)
- [ ] `pnpm build` clean
- [ ] If the change touches UI: visited the page in dark mode at 360 / 768 / 1280 / 1920 px
- [ ] If the change touches text rendering: rendered with a Devanagari + Tamil sample to confirm no clipping
- [ ] If the change adds a token: updated `client/app/globals.css` AND `client/DESIGN.md` AND `/design` showcase
- [ ] If the change touches the spec contract: cited the spec section in the PR description
- [ ] Vercel preview is green

## Tooling rules

- **pnpm** only — no `npm install`, no `yarn`. Corepack picks the right pnpm version.
- **Biome** for lint + format — no eslint, no prettier. `pnpm lint:fix` auto-applies safe fixes.
- **TypeScript strict** — `noUncheckedIndexedAccess` on. No `any` (use `unknown` and narrow).
- **Tailwind v4** — CSS-first config. Theme tokens live in `client/app/globals.css` `@theme` block. No `tailwind.config.ts`.
- **shadcn `base-nova`** preset (Base UI under shadcn) — composition prop is **`render`**, not `asChild`. Vaul (Drawer) is the one Radix exception.
- **`<ButtonLink>` for navigation, `<Button>` for actions.** Never `<Button render={<Link>}>` — produces hydration mismatches + nativeButton warnings (see `client/components/ui/button-link.tsx` for the long-form rationale).
- **`motion/react`** for orchestrated motion — never `framer-motion`.
- **`lucide-react`** for icons — never inline SVG except in `<title>`-marked branded marks (e.g. the Google sign-in icon).
- **Conventional Commits**, see above.

## File size

If a single file you're authoring grows beyond ~300 lines, that's a signal it's doing too much — split it into focused modules with one responsibility each. Your edits and your reviewer's reads are both more reliable on small files.

If you're modifying an existing large file, work carefully but don't unilaterally restructure — open a separate refactor PR if it's blocking you.

## Git hooks

Husky + lint-staged + commitlint are wired:

- **Pre-commit** — `biome check --write` runs on staged files. If you don't want the auto-fix to land, stage selectively.
- **Pre-push** — `tsc --noEmit` runs against the whole tree. If types are red, the push is blocked.
- **Commit-msg** — commitlint verifies the message follows Conventional Commits. If you mistyped the prefix, fix and `git commit --amend`.

To bypass any hook (emergencies only): `git commit --no-verify` / `git push --no-verify`. Never bypass on `main`.

## AI agents (Claude / Cursor / Copilot / Gemini)

This codebase is agent-friendly. Several files exist to make agents produce good code:

- `AGENTS.md` — short rule list, the first thing every agent should read.
- `CLAUDE.md` — `@AGENTS.md` import for Claude Code.
- `.cursor/rules/` — Cursor mirror (TODO).
- `.github/copilot-instructions.md` — Copilot mirror (TODO).
- `client/DESIGN.md` — design system source of truth.
- `.claude/skills/ui/SKILL.md` — auto-activates on UI work, enforces design system.
- `.mcp.json` — 11 MCP servers wired (Supabase, Cloudflare R2, Vercel, Sentry, PostHog, GitHub, shadcn, Playwright, Next.js dev server). Run `pnpm mcp:doctor` to verify.
- `client/node_modules/next/dist/docs/` — version-matched Next.js docs bundled with the package. Agents read these instead of relying on stale training data.

If you find yourself fighting an agent, the fix is usually to add a rule to `AGENTS.md` rather than to hand-correct each file. Make the constraint visible and the agent will follow it next time.

## End-to-end tests

Playwright E2E lives in `client/e2e/`. Critical coverage:

- `canvas-indic.spec.ts` — renders the Fabric canvas in all 4 supported
  languages and asserts `canvas.toDataURL()` succeeds (catches the
  cross-origin canvas-taint bug class).
- `dashboard-flow.spec.ts` — clicks through the full mock generation
  flow + template switching.

```bash
pnpm test:e2e        # headless, exits 0/1
pnpm test:e2e:ui     # interactive UI mode for debugging
```

E2E tests boot a production build via `pnpm build && pnpm start`. First
run after a fresh clone needs Playwright's Chromium binary —
`pnpm test:e2e:install` downloads it (~150 MB, one-off).

## Questions

- Build / scope questions → check `TODO.md` (the living build plan)
- Spec questions → `docs/adcreator_technical_spec.pdf` (immutable; section numbers are stable)
- Anything else → `hello@adcreator.in`
