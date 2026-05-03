# Auth Flow — Email + Password End-to-End

**Date:** 2026-05-03
**Spec source:** TODO §3 + this doc.
**Scope:** Wire the existing auth UI scaffolds into a functioning email/password auth flow with protected routes, password reset, and Turnstile verification on signup.

## Aesthetic intent (frontend-design)

The auth screens already commit to an **editorial, premium dark aesthetic** — saffron accent, Instrument Serif emphasis (`Sign in to AdCreator`), spotlight cards, fade-up entrance motion. We are *not* redesigning. We are *bringing the cards to life*: real submission states, inline validation, password-strength feedback, success/error toasts that match the existing motion language. The unforgettable moment per screen stays the editorial headline; the new texture comes from how the form *responds* — instant inline validation, a softly-animated strength meter, a button that morphs to a spinner without layout shift.

## Out of scope

- Google OAuth (button hidden in UI; callback route stays for Phase 2 reactivation).
- Magic link.
- Email confirmation flow (Supabase config: confirmations OFF for MVP per TODO §3.1).
- Phone / OTP.
- 2FA.

## Architecture

```
┌─────────────── Client form (RHF + Zod) ───────────────┐
│ login-card.tsx · signup-card.tsx · forgot/page · reset │
│   ↓ handleSubmit                                       │
│   ↓ FormData                                           │
└────────────────┬───────────────────────────────────────┘
                 │
┌────────────────▼─────────── Server actions ────────────┐
│ lib/auth/actions.ts                                    │
│   signInAction({email, password}) → ActionResult       │
│   signUpAction({email, password, fullName, turnstile}) │
│   forgotPasswordAction({email})                        │
│   resetPasswordAction({password})                      │
│   signOutAction()                                      │
└────────────────┬───────────────────────────────────────┘
                 │ uses
                 ▼
┌─── lib/supabase/server.ts (already exists) ────────────┐
│   createServerClient w/ Next cookies()                 │
│   sets supabase auth cookie automatically              │
└────────────────────────────────────────────────────────┘
```

Why server actions (not REST or client mutations):

1. The Supabase auth cookie *must* be set on the response. Server actions get the response cookie store via `cookies()` — clean.
2. `useFormState` / `useTransition` give first-class loading & error state with no extra fetcher.
3. Progressive enhancement: form works without JS in dev. (Bonus — not a hard requirement.)
4. One less network hop vs a client → API route → Supabase chain.

## Validation contract

Single source of truth: `lib/schemas/auth.ts` exports Zod schemas reused on both sides.

```ts
const PASSWORD = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[0-9]/, "Include a number")
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/, "Include a symbol");

export const signInSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const signUpSchema = z.object({
  email: z.string().email(),
  password: PASSWORD,
  fullName: z.string().min(1).max(80),
  turnstileToken: z.string().min(1, "Captcha required"),
});
export const forgotSchema = z.object({ email: z.string().email() });
export const resetSchema = z.object({
  password: PASSWORD,
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });
```

Client side: RHF `zodResolver` for instant feedback. Server side: re-parses with the same schema (defense in depth — never trust the client).

## Server-action result shape

```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: keyof FormFields };
```

UI maps `field` to RHF `setError(field, ...)`; absence → toast.

## Signup flow (the most interesting one)

1. Client submits `{ fullName, email, password, turnstileToken }`.
2. Server action:
   1. Re-validate with `signUpSchema`.
   2. `verifyTurnstileToken(turnstileToken, remoteIp)` (lib/turnstile.ts already exists). Fail → `{ok:false, error:"Captcha verification failed"}`.
   3. `supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })`.
   4. `handle_new_user()` trigger fires on `auth.users` insert and creates `public.profiles` row from `raw_user_meta_data.full_name`. (Already migrated.)
   5. Cookie is set on the response. Return `{ ok: true }`.
3. Client `useTransition`: success → `toast.success("Welcome — let's create your first ad")` + `router.replace(next || "/dashboard")`.
4. Errors map to RHF inline (`email_taken` → field "email"; password rejected by Supabase → field "password"; otherwise toast).

## Login flow

1. Client submits `{email, password}` → `signInAction`.
2. Server: `signInWithPassword`. On wrong creds → `{ ok:false, field:"password", error:"Email or password is incorrect" }` (no enumeration — same message for unknown user / wrong password).
3. Success → `toast.success("Welcome back")` + `router.replace(next || "/dashboard")`.

`?next=` carried by middleware redirect → preserved through login. Guarded against open-redirect (`next` must start with `/` and not `//`).

## Forgot password flow

1. `/auth/forgot` → enter email → `forgotPasswordAction`.
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: <APP_URL>/auth/reset })`.
3. Always `{ ok:true }` regardless of whether the address exists (no enumeration). UI: "If an account exists, we sent a reset link."
4. User clicks email link → lands on `/auth/reset?code=…` (Supabase magic-link form).
5. Reset page calls `exchangeCodeForSession` (in `auth/callback` route, reused), then renders the new-password form.
6. `resetPasswordAction({ password })` calls `supabase.auth.updateUser({ password })`.
7. Success → toast → redirect to `/dashboard`.

## Sign-out

`signOutAction` in the dashboard header avatar dropdown. Calls `supabase.auth.signOut()` then `redirect("/login")`. Already a `<DashboardHeader>` exists — we add the dropdown trigger.

## Protected routes

Already wired:
- `middleware.ts` refreshes session and gates `/dashboard`, `/history`, `/billing`, `/settings`, plus the four protected `/api/*` prefixes.
- `app/(dashboard)/layout.tsx` re-checks server-side and redirects if no user.

We add:
- `app/(dashboard)/layout.tsx` reads the user's profile (via service-role) once and stashes name+plan in a Server Component-only context for the header. Avoids per-page DB hits.
- A typed helper `lib/auth/get-current-user.ts` returning `{ user, profile }` so dashboards don't redo the `getUser` + `from('profiles').select(...)` dance.

## Loading & error states (every screen)

| State | Treatment |
|---|---|
| Idle | Saffron primary CTA, Instrument Serif headline. |
| Submitting | Button → `<Loader2 className="animate-spin h-4 w-4" />` + "Signing in…", `disabled`. Inputs locked but visible (no opacity drop — looks broken). |
| Field error | Inline `<p className="text-caption text-destructive mt-1">…</p>` under the offending input. Border turns destructive (`data-invalid` already in shadcn `<Input>`). |
| Form error | sonner `toast.error` for server-level failures (network, captcha, rate limit). Headline never moves; toast appears top-right. |
| Success | `toast.success`, immediate route replace. No flash. |

## Password strength meter (signup only)

Lightweight, no new deps. Compute a 0–4 score on every keystroke:
- length ≥ 8 → +1
- has number → +1
- has symbol → +1
- length ≥ 12 OR has upper+lower → +1

Render as 4 segments under the password input — first 1–4 fill saffron, remaining stay border-color. Animates with `transition-colors duration-fast`. No "weak/medium/strong" label — segments are self-explanatory and scale-agnostic across languages. Accessibility: `aria-valuemin/now/max` + `role="progressbar"` for screen readers.

## Files touched / created

**New**
- `lib/schemas/auth.ts` — Zod schemas.
- `lib/auth/actions.ts` — server actions.
- `lib/auth/get-current-user.ts` — server helper, returns `{ user, profile }`.
- `lib/auth/safe-redirect.ts` — `?next=` open-redirect guard.
- `components/auth/password-strength.tsx` — 4-segment meter.
- `components/dashboard/user-menu.tsx` — avatar dropdown with sign-out (uses existing `dropdown-menu` primitive).
- `e2e/auth-flow.spec.ts` — Playwright happy-path: sign up → land on dashboard → sign out → sign in.

**Modified**
- `app/(auth)/login/login-card.tsx` — wire form, hide Google.
- `app/(auth)/signup/signup-card.tsx` — wire form, hide Google, wire turnstile token, password meter.
- `app/(auth)/auth/forgot/page.tsx` — extract a `<ForgotCard>` client island, wire form.
- `app/(auth)/auth/reset/page.tsx` — same.
- `app/(dashboard)/layout.tsx` — use `getCurrentUser`, pass name+plan to header.
- `components/dashboard/dashboard-header.tsx` — render `<UserMenu>`.
- `lib/supabase/admin.ts` — confirm typed `Database` import is correct (now that types are real).
- `TODO.md` — tick §3.

**Untouched but verified**
- `middleware.ts` — already correct, no changes.
- `app/(auth)/auth/callback/route.ts` — already correct (handles both OAuth code exchange + recovery code from forgot-password email).

## Testing

- **Vitest** unit: schema parses, server actions reject bad input, safe-redirect rejects `//evil.com`, `https://evil.com`, plain `evil.com`.
- **Playwright e2e**: full flow against the live remote DB using a randomly-generated email per run, then deletes the user via service-role afterwards. Lives in `e2e/auth-flow.spec.ts` and gated `test.describe.skip(!process.env.E2E_LIVE_DB)` so it doesn't run in plain `pnpm test:e2e`.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Open redirect via `?next=//evil.com` | `safeRedirect()` requires `next.startsWith("/") && !next.startsWith("//")`. |
| Email enumeration on /login or /forgot | Generic error messages; forgot returns OK regardless. |
| Captcha skipped in dev | `verifyTurnstileToken` already passes through when secret unset (logs warning). Acceptable. Local devs use site-key dev bypass via TurnstileGate. |
| Profile row not created | `handle_new_user()` trigger is `security definer`, set during migration 001. Verified in advisors. |
| Password leak via Supabase error | We never echo Supabase error codes — only mapped, sanitized messages. |
| Race: user submits, navigates, action returns | `useTransition` + `router.replace` after action resolves; no double-submit. |

## Definition of done

1. Sign up → profile row visible in `public.profiles` with `full_name`.
2. Sign in / sign out / forgot / reset all round-trip with proper toasts and routing.
3. Direct hit on `/dashboard` while logged out → bounces to `/login?next=/dashboard`. Login → returns to `/dashboard`.
4. Inline field errors visible & accessible (a screen reader announces them).
5. Password strength meter responds within 16 ms (per-keystroke).
6. `pnpm typecheck` + `pnpm lint` clean.
7. `e2e/auth-flow.spec.ts` green on a Chromium run with `E2E_LIVE_DB=1`.
8. Reduced-motion users see no entrance animations and no strength-meter color animation.
