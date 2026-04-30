/**
 * Public env vars (browser-safe).
 *
 * Only `NEXT_PUBLIC_*` keys belong here — Next.js inlines them at build time
 * and they ship to the client. Anything secret lives in `lib/env.server.ts`.
 *
 * Required vars throw on import. Optional vars are validated when present.
 *
 * See TODO §20 for the full env reference.
 */
import { z } from "zod";

const PublicEnvSchema = z.object({
  // TODO §6 — flip these to required (drop .optional()) once Supabase auth
  // wiring lands. Kept optional for now so a fresh checkout boots without
  // forcing an immediate Supabase project creation.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),

  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),

  // Razorpay key id is technically public — used in client-side checkout.
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

/** `.env.local` files routinely look like `FOO=""` after `cp .env.example`.
 *  Zod's `.optional()` accepts `undefined` but NOT empty strings — they
 *  still get validated against the inner schema and fail `.min(1)`. Drop
 *  any empty / whitespace-only value to `undefined` so optionality behaves
 *  the way operators expect, without polluting the schema with `preprocess`
 *  wrappers that wreck inferred types. */
const trim = <T>(v: T): T | undefined =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const parsed = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: trim(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  NEXT_PUBLIC_APP_URL: trim(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: trim(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  ),
  NEXT_PUBLIC_POSTHOG_KEY: trim(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  NEXT_PUBLIC_POSTHOG_HOST: trim(process.env.NEXT_PUBLIC_POSTHOG_HOST),
  NEXT_PUBLIC_SENTRY_DSN: trim(process.env.NEXT_PUBLIC_SENTRY_DSN),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: trim(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
});

if (!parsed.success) {
  // Print all field errors so the operator can fix them in one go.
  console.error(
    "❌ Invalid public environment variables:\n" +
      Object.entries(parsed.error.flatten().fieldErrors)
        .map(([k, v]) => `  ${k}: ${v?.join(", ")}`)
        .join("\n"),
  );
  throw new Error("Invalid public environment variables");
}

export const publicEnv: PublicEnv = parsed.data;
