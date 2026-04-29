# Design system — India AI Ad Creator

> **Stop. Read this before any UI work.** The `ui` skill (`.claude/skills/ui/SKILL.md`) enforces it, plus the frontend-design philosophy (no AI slop, BOLD aesthetic intent, distinctive typography, atmospheric backgrounds).

The system is **Apple-dark, editorial, distinctive.** True near-black surfaces, hairline elevations, one warm saffron accent, an Instrument Serif moment per page. The product reads as the tool a Bombay agency uses — confident, premium, native to dark mode.

Reference vibes (in order of priority):

1. **Apple Vision Pro / Apple Intelligence landing pages** — spotlight gradients, oversized display type, asymmetric composition, generous whitespace, glass nav, hairline elevations.
2. **Linear's Method launch / latest changelog pages** — editorial moments where Söhne-like display sits next to a serif accent. Numbers in serif. Em-dashes do work.
3. **Loops / Resend marketing** — warmth from a single saturated accent against true dark.

We are NOT going for: Raycast (too techie), Stripe (too white), default shadcn (too generic).

---

## 1. Foundations

### 1.1 Color (OKLCH, dark-first)

All colors live in `client/app/globals.css` under `@theme` and `:root`. Reference them through the **semantic Tailwind utility names** (`bg-background`, `text-foreground`, etc.), never the raw OKLCH or hex.

| Semantic role | Token | Dark value (OKLCH) | Use |
|---|---|---|---|
| `background` | `--color-background` | `oklch(0.085 0.011 264)` | Page surface — true near-black with a whisper of cool blue |
| `foreground` | `--color-foreground` | `oklch(0.985 0.003 264)` | Body text on background |
| `card` | `--color-card` | `oklch(0.135 0.012 264)` | Elevated container — barely lifted off background |
| `card-foreground` | — | `oklch(0.985 0.003 264)` | Text on card |
| `popover` | `--color-popover` | `oklch(0.155 0.013 264)` | Floating surfaces (one notch above card) |
| `popover-foreground` | — | `oklch(0.985 0.003 264)` | Text on popover |
| `primary` | `--color-primary` | `oklch(0.78 0.20 47)` | Saffron — CTAs, active state, brand mark. Punchier against true black. |
| `primary-foreground` | — | `oklch(0.14 0.01 47)` | Text on primary fills (deep) |
| `secondary` | `--color-secondary` | `oklch(0.21 0.013 264)` | Secondary buttons, inert chips |
| `secondary-foreground` | — | `oklch(0.985 0.003 264)` | Text on secondary |
| `muted` | `--color-muted` | `oklch(0.18 0.012 264)` | Subtle fills, inactive nav |
| `muted-foreground` | — | `oklch(0.68 0.012 264)` | Secondary text |
| `accent` | `--color-accent` | `oklch(0.22 0.013 264)` | Hover state for muted surfaces |
| `accent-foreground` | — | `oklch(0.985 0.003 264)` | Text on accent |
| `destructive` | `--color-destructive` | `oklch(0.64 0.22 25)` | Delete, cancel, irreversible |
| `destructive-foreground` | — | `oklch(0.985 0.003 25)` | Text on destructive |
| `border` | `--color-border` | `oklch(1 0 0 / 0.07)` | Hairlines — even subtler than before. The atmosphere does the lifting. |
| `input` | `--color-input` | `oklch(1 0 0 / 0.11)` | Form-field borders |
| `ring` | `--color-ring` | `oklch(0.78 0.20 47 / 0.55)` | Focus ring (saffron at 55%) |

Status colors (used inline only — never as backgrounds for whole panels):

| Role | Token | Value |
|---|---|---|
| `success` | `--color-success` | `oklch(0.72 0.17 152)` |
| `warning` | `--color-warning` | `oklch(0.80 0.16 84)` |
| `info` | `--color-info` | `oklch(0.70 0.13 235)` |

Brand-extended palette (use sparingly, marketing pages only):

| Role | Token | Value | Use |
|---|---|---|---|
| `brand-saffron` | `--color-brand-saffron` | `oklch(0.74 0.18 47)` | Same as primary (alias for marketing copy) |
| `brand-marigold` | `--color-brand-marigold` | `oklch(0.84 0.15 84)` | Secondary marketing accent |
| `brand-indigo` | `--color-brand-indigo` | `oklch(0.55 0.16 277)` | Tertiary marketing accent (hi-vis CTA on marigold sections) |

**Light mode** is deferred to Phase 2. When we add it, mirror the table with light values; do not invent a new system.

### 1.2 Typography

Three families loaded in `client/app/layout.tsx`:

- **Geist Sans** via `geist/font/sans` → `--font-sans` (body + most headings)
- **Geist Mono** via `geist/font/mono` → `--font-mono`
- **Instrument Serif** via `next/font/google` → `--font-serif` (editorial accents only)

The serif is the point of differentiation. Geist alone reads as "modern SaaS"; pairing it with Instrument Serif puts us in the Apple-Vision-Pro / editorial-marketing territory.

| Class | Sample | Use |
|---|---|---|
| `.text-display` | Geist · 64 / 68 px on lg, 48 on sm · weight 500 · tracking `-0.04em` | Hero headlines. **Set `font-feature-settings: "ss01"` for Apple-cadence ligatures.** |
| `.text-display-serif` | Instrument Serif · same size · italic optional | Hero headline alternate. Use when the page needs editorial gravitas. |
| `.text-h1` | Geist · 36 / 44 · 500 · tracking `-0.02em` | Page titles |
| `.text-h2` | Geist · 28 / 36 · 500 · tracking `-0.015em` | Section heads |
| `.text-h3` | Geist · 20 / 28 · 500 | Subsection / card titles |
| `.text-body` | Geist · 15 / 24 · 400 | Default body |
| `.text-body-sm` | Geist · 13 / 20 · 400 | Compact body, table cells |
| `.text-caption` | Geist · 12 / 16 · 400 · `text-muted-foreground` | Helper text, captions |
| `.text-label` | Geist · 11 / 14 · 500 · uppercase · tracking `0.16em` · `text-muted-foreground` | Section eyebrows ("WHAT'S NEW", "PRICING") |
| `.text-mono` | Geist Mono · 12 / 18 | Codes, IDs |
| `.text-serif` | Instrument Serif · inherit size | Wrap individual words / em-dashes / numbers in serif for accent |

**The serif moment.** Once per page. Examples:
- "Studio-quality ads in *your language*" (italicise the noun in serif)
- "Generate 3 variants in *30 seconds*" (the number in serif)
- "Trusted by 2,500 sellers" → serif "2,500"

Don't sprinkle it. One moment. Per page.

Indic scripts: when rendering Devanagari / Tamil / Telugu in HTML (not the Fabric canvas), set `lang="hi" | "ta" | "te"` on the wrapping element so the browser picks the matching Noto family from Google Fonts. On the Fabric canvas, fonts come from `app/api/fonts/[family]` to avoid CORS taint — see `AGENTS.md`.

**Numbers in tables / billing / metrics** use `font-mono tabular-nums` so digits don't dance. Numbers in marketing hero / stats use `.text-serif` for elegance.

### 1.3 Spacing & layout

8 px base, with 4 px supported only for tight icon offsets. Tailwind scale `1`–`16` covers it. **No odd values** (`p-3.5`, `gap-7`).

Container widths:

```
sm   640
md   768
lg  1024
xl  1280
2xl 1440  (hard cap on dashboard content)
```

Page padding: `px-4 sm:px-6 lg:px-8`. Vertical rhythm: `space-y-6` inside cards, `space-y-12` between page sections.

Touch targets: ≥ 44 × 44 px on mobile. Default `Button` is `h-10` (40 px) — wrap with `p-2` parent if mobile-only.

### 1.4 Radius

```
--radius-sm:   6px    (chips, badges)
--radius:      10px   (default — buttons, inputs, cards)
--radius-md:   12px
--radius-lg:   16px   (modals, large surfaces)
--radius-xl:   24px   (hero cards, marketing)
--radius-full: 9999px (avatars, pills)
```

Use `rounded-sm | rounded-md | rounded-lg | rounded-xl | rounded-full`. The bare `rounded` resolves to `--radius`.

### 1.5 Elevation & atmosphere

True near-black backgrounds need atmosphere — not chunky shadows. Apple-style elevation = hairline border + subtle inner highlight + ambient glow.

| Class | Spec | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.4)` | Buttons on hover |
| `shadow-md` | `0 6px 16px -4px rgb(0 0 0 / 0.5)` | Popovers, dropdowns |
| `shadow-lg` | `0 18px 48px -12px rgb(0 0 0 / 0.6)` | Modals, sheets |
| `shadow-glow` | `0 0 0 1px var(--primary), 0 0 32px -6px oklch(from var(--primary) l c h / 0.45)` | Primary CTA on focus, generation success, current-plan card |
| `.spotlight-card` | `before:` pseudo with radial highlight at top edge | Apple-Vision-Pro-style cards |

Atmosphere utilities (use these instead of solid backgrounds on hero sections):

| Utility | Use |
|---|---|
| `.gradient-spotlight` | Single saffron radial in the top right at 0.18 alpha. **Default hero gradient.** |
| `.gradient-aurora` | Multi-radial (saffron + indigo + marigold) at 0.10 each. Marketing hero only — once per site. |
| `.glass` | `bg-background/55 backdrop-blur-2xl border-b border-border`. Nav and floating elements. Stronger blur than before. |
| `.grain` | 3% opacity noise overlay. Use on hero only, never body. |
| `.grid-fade` | Subtle CSS grid background that fades to transparent at edges. Hero secondary atmosphere. |

### 1.6 Motion

Apple-cadence: precise, brief, intentional. Never bouncy.

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | `120ms` | Color, opacity on hover/focus |
| `--duration-base` | `200ms` | Transform, layout-light changes |
| `--duration-slow` | `320ms` | Modal/sheet enter, page sections |
| `--duration-slower` | `520ms` | Hero entrance, scroll-driven moments |
| `--ease-out-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default — Apple-feeling |
| `--ease-in-out-emphasized` | `cubic-bezier(0.83, 0, 0.17, 1)` | Bidirectional motion (toggles) |

Apply via `transition-colors duration-fast ease-out-emphasized` etc.

**Page-load entrance (the page-load moment):** stagger reveals with `motion/react` — `<motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.4, delay: i * 0.06, ease: [0.16,1,0.3,1]}}>`. One choreographed reveal beats ten random hovers (frontend-design philosophy).

**Hover:** `transition-all duration-fast ease-out-emphasized`. Cards: subtle border highlight + bg shift, no scale.

**Scroll-driven (hero only):** `useScroll` from `motion/react` for parallax. Total motion ≤ 400 ms.

**Always honour `prefers-reduced-motion`.** `globals.css` wipes transitions globally for those users; component-level `motion-safe:` for any non-essential animation.

### 1.7 Iconography

`lucide-react` only. Default size `h-4 w-4` inline with text, `h-5 w-5` in nav, `h-6 w-6` only in hero/empty states. `stroke-width={1.75}` (override Lucide's default `2` — feels less harsh on dark).

No emoji in production UI. Emoji is OK in marketing copy or generated ad output, never in chrome.

---

## 2. Component patterns

### 2.1 Buttons

Use shadcn `Button` (in `components/ui/button.tsx`). Variants:

- `default` (primary saffron)
- `secondary` (muted fill)
- `outline` (transparent with border)
- `ghost` (no fill, hover muted)
- `link` (text only, underline on hover)
- `destructive` (subtle destructive — red text on tinted destructive bg)

Sizes (this preset is on the compact side — Linear / Vercel scale):

| Size | Height | Use |
|---|---|---|
| `xs` | h-6 (24 px) | Toolbars, table-row inline actions |
| `sm` | h-7 (28 px) | Dense toolbars, secondary actions in cards |
| `default` | h-8 (32 px) | Standard CTAs in app chrome |
| `lg` | h-9 (36 px) | Hero CTAs, marketing pages |
| `icon` / `icon-sm` / `icon-xs` / `icon-lg` | square | Icon-only |

Mobile minimum touch target (44 × 44 px) is hit by wrapping smaller sizes in a `p-2` parent on `< md`, or by promoting to `lg` on mobile.

**Important — Base UI `render` prop, not Radix `asChild`:** this shadcn preset (`base-nova`) is built on Base UI. To turn a Button into a Link (or any element), use `render={<Link href="…" />}`, **not** `asChild`. The Button's classes and the linked element merge.

```tsx
<Button render={<Link href="/signup">Get started</Link>} />
```

Drawer (Vaul) is the one exception — it still uses Radix under the hood, so it accepts `asChild`. Watch the import path; Base UI primitives live under `@base-ui/react/*`.

Loading: there's no built-in `loading` prop in this preset. Use `<Loader2 className="animate-spin" />` from `lucide-react` inside the button while `disabled`, with `aria-busy` on the parent. We will add a `Spinner` component when this pattern shows up twice.

Never disable without telling the user why — pair with a `Tooltip` or helper text.

CTA hierarchy: **one** primary `default`/`lg` per visible region. Anything else is `secondary` / `ghost` / `outline`.

### 2.2 Inputs & forms

- Always use `Form` + `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormDescription` + `FormMessage` (shadcn).
- Validation: `react-hook-form` + Zod resolver. Client-side validation mirrors the server Zod schema (import the same schema from `lib/schemas/`).
- Error styling: `FormMessage` uses `text-destructive`. The input itself gets `aria-invalid="true"` (handled by shadcn).
- Required fields are marked with a saffron asterisk after the label, never with `(required)` text.
- Helper text uses `FormDescription` (`text-caption`) **above** errors.

### 2.3 Cards

`Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardContent` + `CardFooter`. Dark-first card uses `bg-card border border-border`. **No drop shadow on default cards** — the border + slightly elevated bg is the elevation cue.

Hover-elevated cards (history list, template gallery) gain `hover:bg-accent transition-colors duration-fast`.

### 2.4 Navigation

- Top nav: glass (`bg-background/70 backdrop-blur-xl border-b border-border`), sticky, 64 px tall.
- Sidebar (dashboard only, ≥ md): 240 px wide, `bg-card`, items `h-9 px-3 rounded-md text-body-sm`. Active item: `bg-accent text-foreground`. Inactive: `text-muted-foreground hover:text-foreground hover:bg-accent`.
- Mobile nav: shadcn `Sheet` triggered from a `Menu` icon button. **Do not** build a hamburger drawer from scratch.

### 2.5 Modals / sheets / drawers

- **Modal (centered, focused decision):** shadcn `Dialog`. Max 600 px wide. ESC + click-outside both close.
- **Sheet (side panel, secondary task):** shadcn `Sheet`. Right side default, left side for filters.
- **Drawer (mobile bottom-anchored):** shadcn `Drawer` (Vaul). Use on mobile in place of Dialog when the user is mid-flow.

Always: `DialogTitle` + `DialogDescription` even if visually hidden (`<VisuallyHidden>`). Required for screen readers.

### 2.6 Toasts

`sonner` only, mounted once in `app/layout.tsx` via `<Toaster richColors closeButton position="top-right" />`. Call via `toast.success(...)`, `toast.error(...)`, `toast.message(...)`. Do **not** use a custom hook or `alert()`.

Toast lifetime: 4 s default, 8 s for errors. Dismissable.

### 2.7 Tables / lists

- Default to **lists of cards** on mobile (< md), **tables** on ≥ md. Don't ship horizontal-scroll tables on mobile.
- Use shadcn `Table` for tabular data. Sticky header on long lists.
- Empty state: `EmptyState` component with icon + title + body + primary CTA. Required for every list — no bare "No data".
- Pagination: cursor-based via React Query `useInfiniteQuery`; "Load more" button (no infinite scroll for the dashboard).

### 2.8 Loading & skeletons

- Use `Skeleton` (shadcn) shaped like the eventual content. Never a full-page spinner for above-the-fold content.
- For the generation flow specifically, use `<ProgressStepper />` (defined in `components/generate/`) showing the 6 steps.
- `<Spinner />` is only for inline button loading and short waits (< 1 s).

### 2.9 Empty / error states

Required for every list, query, or generation panel.

```
<EmptyState
  icon={<ImageIcon />}
  title="No ads yet"
  description="Drop a product photo to make your first ad."
  action={<Button>New ad</Button>}
/>
```

Errors get a red icon (`AlertCircle`), the error message in plain Hindi-friendly English (no stack traces in user-facing copy), and a retry CTA.

### 2.10 Data viz (Phase 2 — usage charts)

When we ship usage charts: use **Recharts** with our token colors. No custom SVG charts.

---

## 3. Page composition

### 3.1 Marketing (`/`, `/pricing`, `/templates`)

- Hero: full-bleed, `bg-background` with a subtle radial gradient `from-primary/15 to-transparent` top-right.
- Content max-width: `max-w-screen-xl`, centered.
- Section rhythm: `py-20 sm:py-28`.
- Above-the-fold: heading (`text-display`), subhead (`text-body text-muted-foreground`), one primary CTA, one secondary.
- Social proof / testimonials: marigold accent allowed here. Saffron CTA still wins.

### 3.2 Dashboard (`/dashboard`)

- Two-column layout ≥ lg: left input/template picker (480 px), right preview canvas (fills).
- Generation flow uses `<ProgressStepper>` along the top.
- Live preview is the visual hero of the dashboard — large, surrounded by card with `shadow-lg`.

### 3.3 History (`/history`)

- Grid of generation cards on ≥ md (3 cols, 4 cols at xl). Single column on mobile.
- Each card: thumbnail (16:9 crop), language badge, date in `text-caption`, "Remix" + "Download" actions on hover.

### 3.4 Billing (`/billing`)

- Plan cards: 3 columns ≥ md, stacked on mobile. Current plan gets `border-primary` + `shadow-glow`.
- Usage shown via `Progress` bar with `text-caption` underneath ("32 of 50 generations").

### 3.5 Settings (`/settings`)

- Single-column form, max 720 px wide. Sections separated by `Separator`.
- Destructive ("Delete account") at the bottom, in a `border-destructive/40` card.

---

## 4. Density & responsive

| Breakpoint | Behavior |
|---|---|
| `< sm` (mobile) | Single column. Bottom nav. Drawer for nav/menu. Sheet for filters. |
| `sm` – `md` | Single column with wider gutters. |
| `md` – `lg` | Two-column dashboard layouts unlock. Tables instead of card lists. |
| `lg` – `xl` | Sidebar nav. Full dashboard density. |
| `≥ xl` | Cap content at `max-w-screen-2xl`. Don't let lines exceed 80ch for body text. |

Test every page at **360 / 768 / 1280 / 1920 px**.

---

## 5. Accessibility floor

- WCAG 2.2 AA on every screen. Tokens are pre-tuned; do not override colors locally.
- Every interactive element has a **visible focus ring** (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`).
- Logical tab order. Skip-to-content link in `app/layout.tsx`.
- Language attributes: `<html lang="en">` on layout, `lang="hi|ta|te"` on text in those scripts.
- Form labels are present (visually or via `sr-only`); placeholders are not labels.
- Motion respects `prefers-reduced-motion`.
- Screenshots for screen readers: every meaningful image has alt text. Decorative images get `alt=""`.

---

## 6. Indic & RTL safety

- Hindi headlines run ~25% wider than English equivalents; Tamil ~35%. **Never hard-code text container widths.** Use `min-w-0` on flex children to allow truncation.
- For copy variants: render `lang="hi"` etc. so font fallback picks up correctly.
- The Fabric canvas has its own font path (`app/api/fonts/*`) — see `AGENTS.md` § Indic.
- RTL is not on the MVP roadmap, but use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) where it doesn't hurt readability — keeps Phase 2 (Urdu, Arabic) cheap.

---

## 7. Anti-patterns

The frontend-design rules enforced as a table:

| ❌ Don't | ✅ Do |
|---|---|
| Inter / Roboto / Arial / system-ui as display font | Geist + Instrument Serif pair |
| Purple gradients on white (the "AI slop" tell) | Saffron radial spotlight on true near-black |
| Centered hero with 50/50 split | Asymmetric — text 60% / visual 40%, content offset |
| Solid color section backgrounds | Atmosphere — `.gradient-spotlight`, `.grid-fade`, hairline border |
| Geist for everything | Geist + one Instrument Serif moment per page |
| `bg-zinc-900`, `bg-[#0f0f10]`, `bg-black` | `bg-background` (it's already true near-black) |
| `text-white`, `text-gray-400` | `text-foreground`, `text-muted-foreground` |
| `border-[1px] border-zinc-800/50` | `border border-border` |
| `text-3xl font-bold tracking-tight` (eyeballed) | `.text-display`, `.text-h1`, etc. utility |
| `<div onClick=…>` for buttons | `<Button>` (or `<button>` with all the a11y) |
| `framer-motion` import | `motion/react` (the `motion` package) |
| Custom modal with `position:fixed inset-0` | shadcn `Dialog` |
| `alert()` / custom toast hook | `sonner` |
| `<svg className="animate-spin">` | `<Loader2 className="animate-spin" />` from lucide |
| Random emoji ✨🚀💯 in chrome | `lucide-react` icon |
| Light-mode-only style without dark variant | Default to dark; light is Phase 2 |
| `style={{ color: '#FF6B35' }}` | `text-primary` |
| New token created inline | Add to `globals.css` + this doc first |
| "Just a placeholder, polish later" | Polish now or defer the work — never ship generic |

---

## 8. When you change the design system

1. Update `client/app/globals.css` — tokens are the source.
2. Update **this file** — table + rationale.
3. Update `/_design` showcase route — visual proof.
4. If a token used by an existing component changes meaning (not value), grep for usages and confirm intent across all of them.
5. Note the change in the next PR description ("Design system: added `--motion-very-slow` for hero animations").

---

## 9. Reference: where to find things

- Tokens: `client/app/globals.css`
- Primitives: `client/components/ui/`
- Composed components: `client/components/<domain>/`
- Showcase / visual lock: `client/app/(internal)/_design/page.tsx`
- Skill that enforces this doc: `.claude/skills/ui/SKILL.md`
- shadcn registry config: `client/components.json`
- shadcn MCP: `.mcp.json` → `shadcn`
