/**
 * Shared types — single source of truth for taxonomies used across the app.
 *
 * Re-export from this file. Don't redeclare these elsewhere — duplicate
 * literal unions drift over time.
 */

export const PLANS = ["free", "starter", "pro", "agency"] as const;
export type Plan = (typeof PLANS)[number];

export const LANGUAGES = ["en", "hi", "ta", "te"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  ta: "தமிழ்",
  te: "తెలుగు",
};

export const FORMATS = ["1x1", "9x16", "4x5"] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_DIMENSIONS: Record<
  Format,
  { width: number; height: number; label: string }
> = {
  "1x1": { width: 1080, height: 1080, label: "Square — Post" },
  "9x16": { width: 1080, height: 1920, label: "Vertical — Reels / Story" },
  "4x5": { width: 1080, height: 1350, label: "Portrait — Post" },
};

export const TONES = ["festive", "urgent", "trust", "showcase"] as const;
export type Tone = (typeof TONES)[number];

export const CATEGORIES = [
  "fashion",
  "food",
  "electronics",
  "beauty",
  "home",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const TEMPLATE_CATEGORIES = [
  "sale",
  "showcase",
  "trust",
  "urgency",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const SUBSCRIPTION_STATUSES = [
  "created",
  "active",
  "halted",
  "cancelled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const GENERATION_STATUSES = [
  "pending",
  "processing",
  "complete",
  "failed",
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const INPUT_TYPES = ["url", "photo"] as const;
export type InputType = (typeof INPUT_TYPES)[number];

/** Plan limits — TODO §11.2. Used by lib/quota.ts. */
export const PLAN_LIMITS: Record<Plan, number> = {
  free: 5,
  starter: 50,
  pro: 200,
  agency: Number.POSITIVE_INFINITY,
};
