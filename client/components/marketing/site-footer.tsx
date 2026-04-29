import { Sparkles } from "lucide-react";
import Link from "next/link";

const PRODUCT = [
  { href: "/pricing", label: "Pricing" },
  { href: "/templates", label: "Templates" },
  { href: "/design", label: "Design" },
];
const COMPANY = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refund", label: "Refunds" },
  { href: "/legal/shipping", label: "Shipping" },
];
const LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 border-t border-border overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-medium"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="text-[0.95rem]">AdCreator</span>
            </Link>
            <p className="text-body text-muted-foreground mt-5 max-w-sm leading-7">
              <span className="text-serif text-foreground">Studio-quality</span>{" "}
              ads for Indian small businesses. Built in Bengaluru. Pay in INR.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <span
                  key={l.code}
                  lang={l.code}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-caption text-foreground"
                >
                  <span className="text-mono uppercase opacity-70">
                    {l.code}
                  </span>
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="text-label mb-4">Product</p>
            <ul className="space-y-2.5">
              {PRODUCT.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-body-sm text-muted-foreground hover:text-foreground transition-colors duration-fast"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-label mb-4">Legal</p>
            <ul className="space-y-2.5">
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-body-sm text-muted-foreground hover:text-foreground transition-colors duration-fast"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-caption">
            © 2026 AdCreator · Made in India ·{" "}
            <span className="text-serif text-foreground">हस्तनिर्मित</span>
          </p>
          <p className="text-caption">
            <a
              href="mailto:hello@adcreator.in"
              className="hover:text-foreground transition-colors duration-fast"
            >
              hello@adcreator.in
            </a>
          </p>
        </div>
      </div>

      {/* Ghost wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 sm:-bottom-20 inset-x-0 text-center select-none overflow-hidden"
      >
        <span className="text-[24vw] sm:text-[18vw] font-medium leading-none tracking-tighter text-foreground/[0.03]">
          AdCreator
        </span>
      </div>
    </footer>
  );
}
