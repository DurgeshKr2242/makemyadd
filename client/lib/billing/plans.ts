/**
 * Canonical plan data — imported by both the marketing /pricing page
 * and the in-app <PlanModal>. Single source of truth.
 */

export type PlanVariant = "default" | "secondary" | "outline" | "ghost";
export type PlanId = "free" | "starter" | "pro" | "agency";

export interface PlanPerk {
  ok: boolean;
  text: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  description: string;
  cta: {
    label: string;
    href: string;
    variant: PlanVariant;
  };
  highlight: boolean;
  perks: PlanPerk[];
}

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "0",
    cadence: "forever",
    description: "Try the product",
    cta: { label: "Start free", href: "/signup", variant: "outline" },
    highlight: false,
    perks: [
      { ok: true, text: "5 generations / month" },
      { ok: true, text: "English & Hindi" },
      { ok: false, text: "Watermark on output" },
      { ok: false, text: "1×1 format only" },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "499",
    cadence: "/month",
    description: "For solo founders",
    cta: {
      label: "Upgrade",
      href: "/signup?plan=starter",
      variant: "default",
    },
    highlight: true,
    perks: [
      { ok: true, text: "50 generations / month" },
      { ok: true, text: "All 4 languages" },
      { ok: true, text: "All 3 formats (1×1, 9×16, 4×5)" },
      { ok: true, text: "No watermark · HD download" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "1,199",
    cadence: "/month",
    description: "For active sellers",
    cta: {
      label: "Upgrade",
      href: "/signup?plan=pro",
      variant: "secondary",
    },
    highlight: false,
    perks: [
      { ok: true, text: "200 generations / month" },
      { ok: true, text: "Everything in Starter" },
      { ok: true, text: "Brand kit (Phase 2)" },
      { ok: true, text: "Priority generation queue" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "2,999",
    cadence: "/month",
    description: "For micro-agencies",
    cta: {
      label: "Talk to us",
      href: "mailto:hello@adcreator.in",
      variant: "outline",
    },
    highlight: false,
    perks: [
      { ok: true, text: "Unlimited generations" },
      { ok: true, text: "Everything in Pro" },
      { ok: true, text: "Bulk generation" },
      { ok: true, text: "API access (Phase 2)" },
    ],
  },
] as const;
