import {
  ArrowUpRight,
  CheckCircle2,
  Languages,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LANGS = [
  {
    code: "en",
    name: "English",
    headline: "Festival sale — shop today",
    sub: "Limited stock · Free delivery",
  },
  {
    code: "hi",
    name: "हिन्दी",
    headline: "नया ऑफर — आज ही खरीदें",
    sub: "सीमित स्टॉक · फ्री डिलीवरी",
  },
  {
    code: "ta",
    name: "தமிழ்",
    headline: "புதிய சலுகை — இன்றே வாங்குங்கள்",
    sub: "வரம்பிலான பங்கு · இலவச டெலிவரி",
  },
  {
    code: "te",
    name: "తెలుగు",
    headline: "కొత్త ఆఫర్ — ఈరోజే కొనండి",
    sub: "పరిమిత స్టాక్ · ఉచిత డెలివరీ",
  },
] as const;

const STATS = [
  { number: "30", suffix: "s", label: "End-to-end" },
  { number: "4", suffix: "", label: "Languages, native script" },
  { number: "3", suffix: "×", label: "Variants per generation" },
  { number: "12", suffix: "+", label: "Templates at launch" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Generated in parallel",
    body: "Background removal and copy generation run on separate workers. Your preview is live before you finish reading this sentence.",
  },
  {
    icon: Wand2,
    title: "Templates that actually fit",
    body: "Square, story, and post formats — saffron, indigo, and marigold colourways. Pre-tested at every Indic script for overflow.",
  },
  {
    icon: Languages,
    title: "Native, never translated",
    body: "A separate copy model per language. Hindi reads like Hindi. Tamil and Telugu in their own scripts. No Tanglish, no Hinglish.",
  },
];

export default function Home() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="relative isolate overflow-hidden grain">
        <div
          className="absolute inset-0 -z-10 gradient-aurora pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 grid-fade pointer-events-none opacity-60"
          aria-hidden
        />

        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 pb-24 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            {/* Left — copy (7/12) */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-label">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                Made in India · for Indian small businesses
              </div>

              <h1 className="text-display mt-6 max-w-2xl">
                Studio-quality ads in{" "}
                <span className="text-serif text-primary">your language,</span>{" "}
                in 30 seconds.
              </h1>

              <p className="text-body text-muted-foreground mt-7 max-w-xl text-[1.05rem] leading-8">
                Drop a product photo. Pick a language. Get three ready-to-share
                ad creatives — copy written natively in Hindi, Tamil, Telugu, or
                English; background removed; composited onto a brand-perfect
                template.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  render={
                    <Link href="/signup">
                      Make my first ad <ArrowUpRight />
                    </Link>
                  }
                />
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/templates">Browse templates</Link>}
                />
                <span className="text-caption ml-2 hidden sm:inline">
                  No card · 5 free ads · cancel anytime
                </span>
              </div>

              <div className="mt-10 flex items-center gap-2 text-caption">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Razorpay UPI · INR billing
                <span className="px-2 text-border">·</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Mumbai / Chennai edge served
              </div>
            </div>

            {/* Right — stacked preview cards (5/12) */}
            <div className="lg:col-span-5 relative">
              <div className="relative max-w-md mx-auto lg:mx-0 lg:ml-auto">
                <PreviewCard
                  className="rotate-[-2deg] z-10"
                  lang="hi"
                  headline="नया ऑफर"
                  sub="हाथ से बुनी कॉटन साड़ी · 20% छूट"
                  cta="अभी खरीदें"
                />
                <PreviewCard
                  className="absolute -bottom-12 -right-6 rotate-[3deg] z-20 scale-90"
                  lang="ta"
                  headline="புதிய சலுகை"
                  sub="பருத்தி சேலை · 20% தள்ளுபடி"
                  cta="இன்றே வாங்கு"
                  accent
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hairline" />

      {/* ─────────── STATS ─────────── */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <p className="text-display-serif text-foreground tabular leading-none">
                {s.number}
                <span className="text-primary not-italic">{s.suffix}</span>
              </p>
              <p className="text-caption mt-3 max-w-[14ch] mx-auto md:mx-0">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="hairline" />

      {/* ─────────── LANGUAGES ─────────── */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-12">
          <div className="lg:col-span-5">
            <p className="text-label mb-4">Native, not translated</p>
            <h2 className="text-h1 max-w-md">
              Copy that sounds like{" "}
              <span className="text-serif text-primary">you</span> wrote it.
            </h2>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-body text-muted-foreground self-end">
            A separate model per language. Devanagari for Hindi, Tamil for
            Tamil, Telugu for Telugu — never Tanglish, never Hinglish, never
            translation soup.
          </p>
        </div>

        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-border rounded-xl overflow-hidden border border-border">
          {LANGS.map((l) => (
            <div
              key={l.code}
              className="group bg-card p-7 sm:p-8 transition-colors duration-fast hover:bg-accent"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-h3 text-foreground" lang={l.code}>
                  {l.name}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono uppercase text-[10px] tracking-wider"
                >
                  {l.code}
                </Badge>
              </div>
              <p
                className="text-h3 text-foreground leading-snug mb-2"
                lang={l.code}
              >
                {l.headline}
              </p>
              <p className="text-body-sm text-muted-foreground" lang={l.code}>
                {l.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="hairline" />

      {/* ─────────── FEATURES ─────────── */}
      <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-14">
          <h2 className="text-h1 lg:col-span-7 max-w-2xl">
            Built for the way Indian sellers{" "}
            <span className="text-serif text-primary">actually</span> work.
          </h2>
          <p className="lg:col-span-5 text-body text-muted-foreground self-end">
            Razorpay billing in INR. UPI accepted. WhatsApp share built in.
            Edge-served from Mumbai and Chennai so previews land in under 100ms.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className="spotlight-card group relative bg-card border border-border rounded-2xl p-8 hover:bg-accent transition-colors duration-fast"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-primary">
                  <f.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-mono text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-h3 mb-3">{f.title}</h3>
              <p className="text-body-sm text-muted-foreground leading-6">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="hairline" />

      {/* ─────────── CLOSING CTA ─────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 gradient-spotlight pointer-events-none"
          aria-hidden
        />
        <div className="mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 py-28 sm:py-36 text-center">
          <Sparkles
            className="h-6 w-6 mx-auto text-primary mb-6"
            strokeWidth={1.5}
          />
          <h2 className="text-display max-w-3xl mx-auto">
            Your festival sale,{" "}
            <span className="text-serif text-primary">ready</span> in 30
            seconds.
          </h2>
          <p className="text-body text-muted-foreground mt-6 max-w-xl mx-auto text-lg">
            Five free ads on us. No card. No catch. See for yourself.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              render={
                <Link href="/signup">
                  Make my first ad <ArrowUpRight />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/pricing">See pricing</Link>}
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero preview card — stacked stage element. Pure CSS, no Fabric needed
   for this teaser. Real previews live in the dashboard.
   ───────────────────────────────────────────────────────────────────────── */
function PreviewCard({
  className,
  lang,
  headline,
  sub,
  cta,
  accent,
}: {
  className?: string;
  lang: string;
  headline: string;
  sub: string;
  cta: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`spotlight-card aspect-square w-full max-w-sm rounded-3xl border border-border overflow-hidden shadow-lg ${
        accent
          ? "bg-gradient-to-br from-primary/90 to-brand-marigold/70 text-primary-foreground"
          : "bg-card"
      } ${className ?? ""}`}
    >
      <div className="h-full p-7 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span
            className={`text-label ${accent ? "text-primary-foreground/70" : ""}`}
          >
            Festival 2026
          </span>
          <Badge
            variant="outline"
            className={`font-mono uppercase text-[10px] tracking-wider ${
              accent
                ? "border-primary-foreground/30 text-primary-foreground"
                : ""
            }`}
          >
            {lang}
          </Badge>
        </div>

        <div className="space-y-2" lang={lang}>
          <p className="text-h2 leading-tight">{headline}</p>
          <p
            className={`text-body-sm ${
              accent ? "text-primary-foreground/80" : "text-muted-foreground"
            }`}
          >
            {sub}
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-body-sm font-medium ${
            accent
              ? "bg-primary-foreground text-primary"
              : "bg-primary text-primary-foreground"
          }`}
          lang={lang}
        >
          {cta}
        </div>
      </div>
    </div>
  );
}
