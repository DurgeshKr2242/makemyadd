// client/app/(dashboard)/dashboard/canvas-preview.tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PlanModal } from "@/components/billing/plan-modal";
import {
  FabricCanvas,
  type FabricCanvasHandle,
} from "@/components/canvas/FabricCanvas";
import { TemplateSelector } from "@/components/canvas/TemplateSelector";
import { CopyVariants } from "@/components/generate/copy-variants";
import { LanguagePicker } from "@/components/generate/language-picker";
import { ProgressStepper } from "@/components/generate/progress-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMockGeneration } from "@/lib/generate/use-mock-generation";
import { useShortcuts } from "@/lib/hooks/use-shortcuts";
import { fadeUp, fadeUpHero, staggerChildren } from "@/lib/motion/entrance";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { useGenerationStore } from "@/lib/state/generation";
import type { TemplateConfig } from "@/lib/templates/types";
import type { Language, Tone } from "@/lib/types";

const DEFAULT_COPY: Record<
  Language,
  { headline: string; subheadline: string; cta: string }
> = {
  en: {
    headline: "Festival Sale",
    subheadline: "Limited time · Free delivery",
    cta: "Shop Now",
  },
  hi: {
    headline: "त्योहारी सेल",
    subheadline: "सीमित समय · फ्री डिलीवरी",
    cta: "अभी खरीदें",
  },
  ta: {
    headline: "திருவிழா சலுகை",
    subheadline: "வரம்பிலான நேரம் · இலவச டெலிவரி",
    cta: "இன்றே வாங்கு",
  },
  te: {
    headline: "పండుగ సేల్",
    subheadline: "పరిమిత సమయం · ఉచిత డెలివరీ",
    cta: "ఇప్పుడే కొనండి",
  },
};

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23ffffff'/><stop offset='100%25' stop-color='%23a1a1aa'/></linearGradient></defs><rect width='400' height='400' rx='32' fill='url(%23g)'/><text x='50%25' y='52%25' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%23111'>Sample product</text></svg>`,
  );

const FREE_TIER_LIMIT = 5;

export interface CanvasPreviewProps {
  templates: readonly TemplateConfig[];
  defaultTemplateId: string;
  extractedProduct?: ExtractResponse | null;
}

export function CanvasPreview({
  templates,
  defaultTemplateId,
  extractedProduct = null,
}: CanvasPreviewProps) {
  const [tplId, setTplId] = useState(defaultTemplateId);
  const [language, setLanguage] = useState<Language>("hi");
  const [tone, setTone] = useState<Tone>("festive");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Mock quota tracking — replaced by real quota from lib/quota.ts in §8.
  const [mockQuotaUsed, setMockQuotaUsed] = useState(0);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Plan from Zustand store — controls watermark visibility.
  const plan = useGenerationStore((s) => s.plan);
  const setPlan = useGenerationStore((s) => s.setPlan);

  // Ref to the canvas — used to trigger the real PNG download.
  const canvasRef = useRef<FabricCanvasHandle>(null);

  const { status, steps, variants, start, reset } = useMockGeneration(language);

  const tpl = templates.find((t) => t.id === tplId) ?? templates[0];

  const activeCopy =
    variants.length === 3
      ? (variants[selectedVariantIndex] ?? DEFAULT_COPY[language])
      : extractedProduct
        ? {
            headline: extractedProduct.productName,
            subheadline:
              extractedProduct.productDesc.slice(0, 120) ||
              "Tap Generate to write copy",
            cta: "Coming soon",
          }
        : DEFAULT_COPY[language];

  const activeImageUrl = extractedProduct?.productImageUrl ?? SAMPLE_IMAGE;

  const isRunning = status === "running";
  const isComplete = status === "complete";
  const isQuotaExhausted = mockQuotaUsed >= FREE_TIER_LIMIT;

  // Wrapped start — increments quota counter when a generation completes.
  const handleStart = () => {
    if (isQuotaExhausted) {
      setPlanModalOpen(true);
      return;
    }
    start();
    // Increment after triggering so we don't block the first run.
    // The real counter will live server-side; this is a UI mock.
    setMockQuotaUsed((n) => n + 1);
  };

  const handleDownload = () => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const slug = (extractedProduct?.productName ?? "ad")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    const filename = `adcreator-${slug || "ad"}-${ts}`;
    const ok = canvasRef.current?.download(filename) ?? false;
    if (ok) {
      toast.success("Downloaded", {
        description: `${filename}.png saved to your downloads folder.`,
      });
    } else {
      toast.error("Download failed", {
        description: "Canvas wasn't ready. Try again.",
      });
    }
  };

  // Power-user keyboard shortcuts
  useShortcuts([
    {
      keys: "d",
      description: "Download current canvas",
      handler: handleDownload,
    },
    {
      keys: "g",
      description: "Generate copy",
      handler: () => {
        if (!isRunning && !isComplete) handleStart();
      },
    },
    {
      keys: ["1", "2", "3"],
      description: "Switch to copy variant 1 / 2 / 3",
      handler: (e) => {
        if (variants.length !== 3) return;
        const idx = Number.parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx <= 2) setSelectedVariantIndex(idx);
      },
    },
  ]);

  const reducedMotion = useReducedMotion();

  return (
    <>
      <motion.div
        className="space-y-5"
        initial={reducedMotion ? false : "hidden"}
        animate="show"
        variants={staggerChildren()}
      >
        {/* Language & tone picker */}
        <motion.div variants={fadeUp}>
          <LanguagePicker
            language={language}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              reset();
            }}
            tone={tone}
            onToneChange={setTone}
          />
        </motion.div>

        {/* Progress stepper — visible while running */}
        {isRunning && (
          <div className="bg-card border border-border rounded-2xl px-5 py-4">
            <p className="text-label mb-4">Generating</p>
            <ProgressStepper steps={steps} />
          </div>
        )}

        {/* Extracted product badge */}
        {extractedProduct ? (
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-mono">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            {extractedProduct.productName}
          </div>
        ) : null}

        {/* Canvas card */}
        <motion.div
          className="spotlight-card relative bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg"
          variants={fadeUpHero}
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-label">Live preview</p>
            <div className="flex items-center gap-2">
              {plan === "free" && (
                <Badge
                  variant="outline"
                  className="bg-warning/10 text-warning font-mono uppercase text-[10px] tracking-wider"
                >
                  Watermark
                </Badge>
              )}
              <Badge
                variant="outline"
                className="font-mono uppercase text-[10px] tracking-wider"
              >
                {tpl?.format} · {tpl?.canvas.width}
              </Badge>
            </div>
          </div>

          <div className="flex justify-center">
            {tpl ? (
              <FabricCanvas
                ref={canvasRef}
                template={tpl}
                productImageUrl={activeImageUrl}
                copy={activeCopy}
                language={language}
                watermark={plan === "free"}
                displayWidth={420}
              />
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={handleDownload}>
              Download
            </Button>
            {isComplete ? (
              <Button
                variant="secondary"
                onClick={() => {
                  reset();
                }}
              >
                Generate again
              </Button>
            ) : isQuotaExhausted ? (
              <Button
                onClick={() => setPlanModalOpen(true)}
                disabled={isRunning}
              >
                Upgrade to keep generating
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={isRunning}
                aria-busy={isRunning}
              >
                {isRunning ? "Generating…" : "Generate copy"}
              </Button>
            )}
          </div>

          {/* Mock quota indicator */}
          {mockQuotaUsed > 0 && !isQuotaExhausted && (
            <p className="text-caption text-center mt-3">
              {mockQuotaUsed} of {FREE_TIER_LIMIT} free generations used
            </p>
          )}

          {/* Keyboard shortcut hint — desktop only */}
          <div className="hidden lg:flex items-center gap-3 mt-4 pt-4 border-t border-border/50 text-muted-foreground">
            <span className="text-[10px] tracking-wider uppercase font-mono">
              Shortcuts
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="bg-muted text-mono px-1.5 py-0.5 rounded text-[10px] tracking-wider">
                D
              </kbd>
              Download
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="bg-muted text-mono px-1.5 py-0.5 rounded text-[10px] tracking-wider">
                G
              </kbd>
              Generate
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1 text-[11px]">
              <kbd className="bg-muted text-mono px-1.5 py-0.5 rounded text-[10px] tracking-wider">
                1
              </kbd>
              <kbd className="bg-muted text-mono px-1.5 py-0.5 rounded text-[10px] tracking-wider">
                2
              </kbd>
              <kbd className="bg-muted text-mono px-1.5 py-0.5 rounded text-[10px] tracking-wider">
                3
              </kbd>
              Variants
            </span>
          </div>
        </motion.div>

        {/* Copy variants — visible once generation is complete */}
        {isComplete && variants.length === 3 && (
          <motion.div variants={fadeUp}>
            <CopyVariants
              variants={variants}
              selectedIndex={selectedVariantIndex}
              onSelect={setSelectedVariantIndex}
              language={language}
            />
          </motion.div>
        )}

        {/* Template selector */}
        <motion.div variants={fadeUp}>
          <p className="text-label mb-3">Template</p>
          <TemplateSelector
            templates={templates}
            value={tpl?.id ?? ""}
            onChange={setTplId}
          />
        </motion.div>
      </motion.div>

      {/* Plan upgrade modal */}
      <PlanModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        recommended="starter"
        onUpgrade={(upgradedPlan) => {
          setPlan(upgradedPlan);
          setPlanModalOpen(false);
          toast.success(`Upgraded to ${upgradedPlan}`, {
            description:
              "Watermark removed. Generations reset to monthly limit.",
          });
        }}
      />
    </>
  );
}
