---
name: ui
description: Activates whenever the user requests any UI/UX work — new screens, components, layouts, styling tweaks, theme adjustments, marketing pages, dashboard views, modals, forms, motion, icons, empty states, error states. Enforces the project's design system in client/DESIGN.md and the shadcn-only component policy. Triggers on phrases like "build the X page", "add a button", "design", "style", "make it look", "polish", "redesign", "ui", "ux", "modal", "dialog", "form", "component", "screen", "layout", "responsive", "dark mode", "animate", "transition", "hover", "focus", "loading state", "empty state", "skeleton", "toast".
---

# UI work — design-system gate + frontend-design philosophy

Every UI task in this repo passes through this skill before code is written. Two non-negotiables:

1. **The project has a single design system.** Read `client/DESIGN.md` first. Drift kills it.
2. **The project ships an Apple-dark, distinctive aesthetic.** No "AI slop" defaults. The frontend-design rules below apply on top of the design system.

The product reads as the tool a Bombay agency uses — confident, modern, native to dark mode, with one warm saffron accent that holds against true obsidian. Reference vibe: **Apple Vision Pro / Apple Intelligence / Linear's Method launch** — premium, restrained, one moment of editorial surprise per page.

---

## Step 0 — read first, code second

Before producing any JSX, CSS, or component file, read these in order:

1. `client/DESIGN.md` — **source of truth.** Tokens, motion, density, typography pair, accessibility floor, anti-patterns. Conflicts with this skill? DESIGN.md wins.
2. `client/app/globals.css` — the `@theme` block. Confirm the token name you're about to use exists; do not invent new tokens inline.
3. `client/components/ui/` — list existing shadcn primitives. Reuse before installing. Install before authoring.
4. `AGENTS.md` § "Indic text rendering" — if the change touches text or canvas, the per-language Playwright snapshot is mandatory.

If `client/DESIGN.md` does not exist yet, stop and ask the user — the design system has been wiped.

---

## Step 1 — commit to a BOLD direction (frontend-design rule)

Before coding, name the aesthetic intent in one sentence. Apple-dark is not "default dark mode plus shadcn" — it's a specific stance:

- **Tone:** premium, restrained, editorial. Not maximalist, not playful, not utilitarian.
- **Differentiation:** the one thing someone remembers. Examples: the spotlight gradient behind the hero, the serif em-dash in the sub-head, the way numbers are typeset in Instrument Serif.
- **Refinement:** every spacing decision is intentional. 8 px grid, no `p-3.5`. One primary CTA per region. Generous line-height.

If you can't name what makes the screen unforgettable, you're not done designing — keep going.

---

## Step 2 — pick the component path (in this order)

1. **Reuse** — is there a component in `client/components/` that does this? Use it.
2. **shadcn registry** — query the **shadcn MCP** (`.mcp.json` → `shadcn`) for an off-the-shelf primitive. Install via `pnpm dlx shadcn@canary add <name>`. Never copy shadcn source by hand.
3. **Compose** — build the new piece by composing existing primitives. Stay in our token space.
4. **Author from scratch** — only if 1–3 fail. New primitives go under `client/components/ui/` and follow the `cva` + `data-slot` pattern of the rest.

---

## Step 3 — strict tokens (no exceptions)

Use the semantic Tailwind utilities backed by our `@theme` block:

- Backgrounds: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-primary`, `bg-destructive`. Never `bg-zinc-900`, `bg-black`, `bg-[#xxxxxx]`.
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-primary-foreground`. Never `text-white`, `text-gray-400`, raw hex.
- Borders: `border-border`, `border-input`, `ring-ring`. Never `border-zinc-800`.
- Radius: `rounded-sm | rounded-md | rounded-lg | rounded-xl | rounded-2xl | rounded-full`. No `rounded-[7px]`.
- Shadow / elevation: `shadow-sm | shadow-md | shadow-lg | shadow-glow`. No custom box-shadow strings.
- Motion: `transition-colors`, `transition-transform`, `duration-fast | duration-base | duration-slow`, `ease-out-emphasized` (Apple-cadence). Complex motion: `motion/react`. All durations come from `--duration-*` tokens.

Arbitrary values (`bg-[...]`, `text-[14.5px]`) are a code-review failure. If the design needs something the tokens don't have, **add it to `globals.css` first**, then use it.

---

## Step 4 — typography (frontend-design rule)

Per the frontend-design philosophy: **avoid generic AI fonts** (Inter, Roboto, Arial, system-ui-only). Pair a distinctive display with a refined body.

Our pairing is:

- **Geist Sans** — body + most headings. SF Pro DNA, distinctive, owned by Vercel. Loaded as `--font-sans`.
- **Geist Mono** — code, currency in tables, IDs. Loaded as `--font-mono`.
- **Instrument Serif** — editorial accent. Used SPARINGLY for:
  - Eyebrows over hero sections
  - Em-dash interjections in display copy
  - Big numbers in stats (`stats: 2.5M ads → 30 sec`)
  - Pull quotes
  - **Never for body, buttons, or chrome.**
  Loaded as `--font-serif`. Apply via the `.text-serif` utility or `font-serif` class.

Use the typography utility classes (`.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-body-sm`, `.text-caption`, `.text-label`, `.text-mono`, `.text-serif`). Never eyeball `text-3xl font-semibold`.

Indic scripts (Devanagari / Tamil / Telugu) get the matching Noto family via the canvas font proxy — see DESIGN.md § Typography → Indic.

---

## Step 5 — color & atmosphere (frontend-design rule)

**Background is not a solid color.** Every primary surface gets atmosphere — radial spotlights, hairline borders, subtle grain, controlled depth. The frontend-design skill calls this out explicitly: "Create atmosphere and depth rather than defaulting to solid colors."

Patterns we use:

- `.gradient-spotlight` — single saffron radial in the top right, 0.18 alpha. Default hero background.
- `.gradient-aurora` — multi-radial (saffron + indigo + marigold), 0.12 alpha each. For marketing hero only.
- `.glass` — `bg-background/60 backdrop-blur-2xl border-b border-border`. Nav and floating elements only.
- `.grain` — 3% opacity noise overlay. Use sparingly to break flat backgrounds.
- `.spotlight-card` — radial highlight on top edge of cards (Apple Vision Pro card pattern).

**The accent (saffron) is for CTAs, active state, and the brand mark only.** Never body text, never large fills. One primary `default` per visible region.

WCAG AA on every surface. Tokens are pre-tuned — don't override locally.

---

## Step 6 — composition (frontend-design rule)

**Predictable layouts are an AI-slop tell.** Break the grid where it earns it:

- Asymmetric hero: text 60%, visual 40% — not 50/50 centered.
- Overlap: cards that bleed into the section above on `lg:`.
- Generous negative space: `py-24 sm:py-32` on marketing sections, never `py-8`.
- Anchor moments: one diagonal, one offset, one oversized element per page — no more.
- Density on data screens (dashboard, history, billing) — Linear-tight.
- Density on marketing — Apple-loose.

Container caps: `max-w-screen-xl` for marketing, `max-w-screen-2xl` for dashboard, `max-w-screen-md` for forms / legal.

---

## Step 7 — motion (frontend-design rule)

Apple-cadence: precise, brief, intentional. Never bouncy.

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 120ms | Color, opacity on hover/focus |
| `--duration-base` | 200ms | Transform, layout-light changes |
| `--duration-slow` | 320ms | Modal/sheet enter, page sections |
| `--ease-out-emphasized` | cubic-bezier(0.16, 1, 0.3, 1) | Default — Apple-feeling |

- Page-level: orchestrated entrance with stagger. View Transitions API or `motion/react` `<motion.div initial animate transition={{ delay: i * 0.06 }}>`.
- Component-level (modals, drawers, accordions): use the Radix/Base UI defaults from shadcn.
- Hover: `transition-all duration-fast ease-out-emphasized`.
- Scroll-driven: `motion/react`'s `useScroll` for the hero parallax. Total motion ≤ 400 ms.

**Honour `prefers-reduced-motion`.** `globals.css` already wipes transitions globally for those users; component-level `motion-safe:` for any non-essential animation.

---

## Step 8 — accessibility (non-negotiable)

- Every interactive element has a focus ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`). Inherited from shadcn primitives — do not strip.
- Buttons / links have an accessible name. Icons-only need `<span class="sr-only">` or `aria-label`.
- Dialogs use shadcn `Dialog` / `Sheet` / `Drawer` — focus trap / ESC / scroll lock for free.
- Form fields use `Label` + `Input` + helper text. No bare `<input>`.
- Colour is never the sole signal — pair red with an icon, green with a check.
- Test keyboard navigation before declaring done.

---

## Step 9 — states (every component, every time)

For each component you ship, define and render:
- **default · hover · focus-visible · active · disabled · loading · empty · error**

If the component fetches data, ship the matching `<Skeleton>` and the empty/error UI in the same file. No bare `null` returns.

---

## Step 10 — Indic + RTL safety

- Test every text-bearing component at all four MVP languages (en, hi, ta, te). Devanagari and Tamil run wider than Latin — never hard-code `w-[200px]` for text containers.
- Use `lang="hi" | "ta" | "te"` on text in those scripts so font fallback picks the right Noto.
- The Fabric canvas has its own font path (`app/api/fonts/*`) — see `AGENTS.md` § Indic.
- RTL is Phase 2, but use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) where it doesn't hurt readability.

---

## Step 11 — verify before done

- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean (Biome catches token violations)
- [ ] Visited the component in the browser in dark mode at 360 px, 768 px, 1280 px, and 1920 px.
- [ ] Tabbed through it — focus rings visible, order logical.
- [ ] If text-bearing: rendered with a Devanagari sample (e.g. "नया ऑफर — आज ही खरीदें") and a Tamil sample without overflow.
- [ ] Updated `client/DESIGN.md` if you introduced a new token, pattern, or component category.
- [ ] One sentence in the PR description naming the aesthetic intent of the change ("This page leans into the editorial-serif accent for the hero stat" etc.).

---

## Base UI vs Radix — pick the right composition prop

This shadcn preset (`base-nova`) is built on **Base UI**, not Radix. The composition prop is **`render`**, not `asChild`:

```tsx
// ✅ correct — DialogTrigger renders a real <button>
<DialogTrigger render={<Button variant="outline">Open</Button>} />

// ❌ this will TypeScript-error and not behave correctly
<DialogTrigger asChild><Button variant="outline">Open</Button></DialogTrigger>
```

Drawer (Vaul) is the one exception — Radix-based, uses `asChild`. If a primitive's import path is `@base-ui/react/*`, use `render`. If it's `vaul` or `@radix-ui/*`, use `asChild`.

### Buttons that navigate — use `<ButtonLink>`, NOT `<Button render={<Link/>}>`

Base UI's `<Button>` defaults to `nativeButton: true` — it expects a real `<button>`. Forcing it to `render={<Link />}` does three bad things:

1. Emits a console warning every render (`Base UI: A component that acts as a button expected a native <button>`).
2. Hydration mismatch — Base UI's class-merger adds variant classes like `group` differently SSR vs client, you get a `className didn't match` error.
3. Loses native button semantics in forms / a11y.

Use **`<ButtonLink>`** (in `client/components/ui/button-link.tsx`) for navigation. It's a Next `<Link>` styled with the shared `buttonVariants` — no Base UI wrapper, no warnings, no hydration drift.

```tsx
// ✅ correct — link styled like a button
<ButtonLink href="/signup" size="lg">
  Get started <ArrowUpRight />
</ButtonLink>

// ✅ correct — real button (onClick handler)
<Button onClick={handleClick}>Save draft</Button>

// ❌ never — produces hydration mismatch + nativeButton warning
<Button render={<Link href="/signup">Get started</Link>} />
```

Rule of thumb: if the action is `href=`, use `<ButtonLink>`. If the action is `onClick=` or `type="submit"`, use `<Button>`.

---

## Anti-patterns (immediate rejection — frontend-design + project rules)

- ❌ **Inter / Roboto / Arial / system-ui as the display font.** Geist + Instrument Serif only.
- ❌ **Purple gradients on white.** The "AI slop" tell. We're dark-first; the accent is saffron.
- ❌ **Centered hero with 50/50 split.** Lazy. Asymmetric is the rule.
- ❌ Solid-color section backgrounds. Add atmosphere — spotlight, grain, or border depth.
- ❌ `className="bg-[#0a0a0a] text-[#fafafa]"` — use tokens.
- ❌ Inline `style={{ ... }}` for visual styling — Tailwind utilities only.
- ❌ Importing from `@radix-ui/*` directly in app code — go through `components/ui/`.
- ❌ `framer-motion` import — we use `motion` (the `motion/react` import path).
- ❌ Custom modal built on `<dialog>` or position:fixed divs — use `Dialog` / `Sheet` / `Drawer`.
- ❌ Loading spinners spun up locally — wrap `<Loader2 className="animate-spin" />` from `lucide-react`, or use `<Skeleton>`.
- ❌ Toasts with `alert()` or a custom hook — use `sonner`'s `toast.*` API.
- ❌ Random emoji in production UI for status — use `lucide-react` icons.
- ❌ Adding a new color / radius / shadow / motion duration without updating `globals.css` and `DESIGN.md` first.
- ❌ Using `asChild` on a Base UI primitive — the prop is `render`. (And vice versa for Vaul.)
- ❌ Ending a component without defining the empty / error / loading states.
- ❌ "It's just a placeholder, I'll polish later." Polish now or defer the work — never ship a generic-looking screen.
