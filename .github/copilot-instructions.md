# AdCreator — instructions for GitHub Copilot

Read **`AGENTS.md` at the repo root** before suggesting any code — it's the source of truth for project rules. The most-violated rules:

1. **Stack** — Next.js 16 canary + Tailwind v4 + Biome (NOT eslint/prettier) + shadcn `base-nova` (Base UI: composition prop is `render`, NOT `asChild`; Vaul is the one Radix exception). pnpm only.

2. **`<ButtonLink>` for navigation, `<Button>` for actions.** Never `<Button render={<Link/>}>`. See `client/components/ui/button-link.tsx`.

3. **Design tokens only.** No `bg-zinc-*`, no hex, no `text-white`. Use semantic Tailwind utilities (`bg-card`, `text-foreground`, `border-border`). Read `client/DESIGN.md` before any UI change.

4. **Indic safety** — `client/components/canvas/FabricCanvas.tsx` and font-proxy routes have per-language Playwright tests. Run `pnpm test:e2e` before suggesting changes there.

5. **Server-only** — `lib/supabase/admin.ts` and `lib/env.server.ts` are server-only. Don't import from Client Components.

The Next.js application lives in `client/`. All `pnpm` commands run from there. The Supabase migrations live in `client/supabase/`.

Conventional Commits enforced via commitlint (commit-msg hook). Use `feat:` `fix:` `chore:` `docs:` `refactor:` `test:` `ci:` `perf:`.

For visual changes, also read `client/DESIGN.md` and the `.claude/skills/ui/SKILL.md` skill — they encode the Apple-dark aesthetic with Geist + Instrument Serif typography pair, hairline elevations, atmospheric backgrounds, and one serif moment per surface.
