"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { fadeUp, fadeUpHero, staggerChildren } from "@/lib/motion/entrance";

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

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
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
          {/* Left — copy column (7/12) with staggered entrance */}
          <motion.div
            className="lg:col-span-7"
            initial={reducedMotion ? false : "hidden"}
            animate="show"
            variants={staggerChildren()}
          >
            <motion.div
              className="inline-flex items-center gap-2 text-label"
              variants={fadeUp}
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              Made in India · for Indian small businesses
            </motion.div>

            <motion.h1
              className="text-display mt-6 max-w-2xl"
              variants={fadeUp}
            >
              Studio-quality ads in{" "}
              <span className="text-serif text-primary">your language,</span> in
              30 seconds.
            </motion.h1>

            <motion.p
              className="text-body text-muted-foreground mt-7 max-w-xl text-[1.05rem] leading-8"
              variants={fadeUp}
            >
              Drop a product photo. Pick a language. Get three ready-to-share ad
              creatives — copy written natively in Hindi, Tamil, Telugu, or
              English; background removed; composited onto a brand-perfect
              template.
            </motion.p>

            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
              variants={fadeUp}
            >
              <ButtonLink href="/signup" size="lg">
                Make my first ad <ArrowUpRight />
              </ButtonLink>
              <ButtonLink href="/templates" size="lg" variant="outline">
                Browse templates
              </ButtonLink>
              <span className="text-caption ml-2 hidden sm:inline">
                No card · 5 free ads · cancel anytime
              </span>
            </motion.div>

            <motion.div
              className="mt-10 flex items-center gap-2 text-caption"
              variants={fadeUp}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Razorpay UPI · INR billing
              <span className="px-2 text-border">·</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Mumbai / Chennai edge served
            </motion.div>
          </motion.div>

          {/* Right — stacked preview cards (5/12) with hero fade-up */}
          <motion.div
            className="lg:col-span-5 relative"
            initial={reducedMotion ? false : "hidden"}
            animate="show"
            variants={fadeUpHero}
          >
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
