import { ArrowUpRight, Languages, Sparkles, Wand2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Hero } from "./hero";

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
      <Hero />

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
            <ButtonLink href="/signup" size="lg">
              Make my first ad <ArrowUpRight />
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="outline">
              See pricing
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
