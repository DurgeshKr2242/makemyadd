import { ArrowUpRight, Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans for solo founders, growing brands, and agencies.",
};

const PLANS = [
  {
    name: "Free",
    price: "0",
    cadence: "forever",
    description: "Try the product",
    cta: { label: "Start free", href: "/signup", variant: "outline" as const },
    highlight: false,
    perks: [
      { ok: true, text: "5 generations / month" },
      { ok: true, text: "English & Hindi" },
      { ok: false, text: "Watermark on output" },
      { ok: false, text: "1×1 format only" },
    ],
  },
  {
    name: "Starter",
    price: "499",
    cadence: "/month",
    description: "For solo founders",
    cta: {
      label: "Upgrade",
      href: "/signup?plan=starter",
      variant: "default" as const,
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
    name: "Pro",
    price: "1,199",
    cadence: "/month",
    description: "For active sellers",
    cta: {
      label: "Upgrade",
      href: "/signup?plan=pro",
      variant: "secondary" as const,
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
    name: "Agency",
    price: "2,999",
    cadence: "/month",
    description: "For micro-agencies",
    cta: {
      label: "Talk to us",
      href: "mailto:hello@adcreator.in",
      variant: "outline" as const,
    },
    highlight: false,
    perks: [
      { ok: true, text: "Unlimited generations" },
      { ok: true, text: "Everything in Pro" },
      { ok: true, text: "Bulk generation" },
      { ok: true, text: "API access (Phase 2)" },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 gradient-spotlight pointer-events-none"
          aria-hidden
        />
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12">
          <div className="max-w-3xl">
            <p className="text-label mb-5">Pricing</p>
            <h1 className="text-display">
              Plans that <span className="text-serif text-primary">grow</span>{" "}
              with you.
            </h1>
            <p className="text-body text-muted-foreground mt-6 text-lg leading-8 max-w-2xl">
              Start free. Upgrade when you're ready. Cancel anytime — your
              access lasts through the end of the billing period.
            </p>
            <p className="text-caption mt-6">
              All prices in INR · UPI · NetBanking · all major cards accepted ·{" "}
              <Link
                href="/legal/refund"
                className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
              >
                refund policy
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-border rounded-2xl overflow-hidden border border-border">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`relative spotlight-card flex flex-col bg-card p-7 sm:p-8 ${
                plan.highlight ? "lg:scale-[1.02] lg:z-10" : ""
              }`}
            >
              {plan.highlight ? (
                <Badge className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest">
                  Most popular
                </Badge>
              ) : null}

              <div className="mb-6">
                <p className="text-label mb-2">{plan.name}</p>
                <p className="text-body-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-display-serif text-foreground tabular leading-none">
                  ₹{plan.price}
                </span>
                <span className="text-body-sm text-muted-foreground ml-2">
                  {plan.cadence}
                </span>
              </div>

              <ul className="space-y-3 text-body-sm flex-1">
                {plan.perks.map((perk) => (
                  <li
                    key={perk.text}
                    className={`flex gap-3 items-start ${
                      perk.ok ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {perk.ok ? (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{perk.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-border">
                <ButtonLink
                  href={plan.cta.href}
                  variant={plan.cta.variant}
                  className="w-full"
                >
                  {plan.cta.label}
                  {plan.cta.variant === "default" ? <ArrowUpRight /> : null}
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3 text-center md:text-left">
          <div>
            <p className="text-label mb-2">Annual</p>
            <p className="text-body text-muted-foreground">
              <span className="text-serif text-foreground">2 months free</span>{" "}
              when billed yearly. Pick the toggle at checkout.
            </p>
          </div>
          <div>
            <p className="text-label mb-2">Cancel anytime</p>
            <p className="text-body text-muted-foreground">
              You keep access until the end of the billing period. No questions
              asked.
            </p>
          </div>
          <div>
            <p className="text-label mb-2">Need more?</p>
            <p className="text-body text-muted-foreground">
              <a
                href="mailto:hello@adcreator.in"
                className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
              >
                Talk to us
              </a>{" "}
              about volume, white-label, and on-prem.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
