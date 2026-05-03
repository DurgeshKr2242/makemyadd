// client/app/(dashboard)/dashboard/dashboard-shell.tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PlanModal } from "@/components/billing/plan-modal";
import {
  Inspector,
  type InspectorState,
} from "@/components/dashboard/inspector";
import { InputForm, type InputValue } from "@/components/generate/input-form";
import {
  ManualEntryDialog,
  type ManualEntryHint,
} from "@/components/generate/manual-entry-dialog";
import { useMockGeneration } from "@/lib/generate/use-mock-generation";
import { useShortcuts } from "@/lib/hooks/use-shortcuts";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { useGenerationStore } from "@/lib/state/generation";
import { PALETTES, type PaletteId, withAccent } from "@/lib/templates/palettes";
import { getTemplate } from "@/lib/templates/registry";
import type { Format } from "@/lib/types";

import { CanvasPreview } from "./canvas-preview";

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23ffffff'/><stop offset='100%25' stop-color='%23a1a1aa'/></linearGradient></defs><rect width='600' height='800' fill='url(%23g)'/><text x='50%25' y='52%25' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%23111'>Sample product</text></svg>`,
  );

const DEFAULT_COPY = {
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
} as const;

const FREE_TIER_LIMIT = 5;

export function DashboardShell() {
  // ── Source state (URL / upload / manual) ─────────────────────────────
  const [inputValue, setInputValue] = useState<InputValue>({ type: "empty" });
  const [extractedProduct, setExtractedProduct] =
    useState<ExtractResponse | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualHint, setManualHint] = useState<ManualEntryHint | null>(null);

  // ── Inspector state ──────────────────────────────────────────────────
  const [family, setFamily] = useState<"spotlight" | "editorial">("spotlight");
  const [format, setFormat] = useState<Format>("1x1");
  const [paletteId, setPaletteId] = useState<PaletteId | "custom">("saffron");
  const [customAccent, setCustomAccent] = useState<string>("#FF9D3D");

  const language = useGenerationStore((s) => s.language);
  const setLanguage = useGenerationStore((s) => s.setLanguage);
  const tone = useGenerationStore((s) => s.tone);
  const setTone = useGenerationStore((s) => s.setTone);
  const plan = useGenerationStore((s) => s.plan);
  const setPlan = useGenerationStore((s) => s.setPlan);
  const selectedVariantIndex = useGenerationStore(
    (s) => s.selectedVariantIndex,
  );
  const setSelectedVariantIndex = useGenerationStore(
    (s) => s.setSelectedVariantIndex,
  );

  // ── Generation (mock for now — Groq lands in §10) ────────────────────
  const { status, steps, variants, start, reset } = useMockGeneration(language);

  // ── Quota mock — replaced by real quota in §11.2 ─────────────────────
  const [mockQuotaUsed, setMockQuotaUsed] = useState(0);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Mirror file uploads into extractedProduct for the live canvas.
  useEffect(() => {
    if (inputValue.type === "file") {
      setExtractedProduct({
        productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
        productDesc: `${(inputValue.file.size / 1024).toFixed(0)} KB · ${inputValue.file.type}`,
        productImageUrl: inputValue.previewUrl,
      });
    } else if (inputValue.type === "uploaded") {
      let cancelled = false;
      (async () => {
        const res = await fetch("/api/generate/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: "photo",
            imageKey: inputValue.key,
          }),
        });
        if (cancelled) return;
        if (res.ok) {
          const product = (await res.json()) as ExtractResponse;
          setExtractedProduct(product);
        } else {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (body?.error === "vision_failed") {
            setManualHint({
              source: "photo",
              imageUrlIfAny: inputValue.publicUrl,
            });
            setManualOpen(true);
          }
          setExtractedProduct({
            productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
            productDesc: `Uploaded · ${(inputValue.file.size / 1024).toFixed(0)} KB`,
            productImageUrl: inputValue.publicUrl,
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    } else if (inputValue.type === "empty") {
      setExtractedProduct(null);
    }
  }, [inputValue]);

  // ── Derived render inputs ────────────────────────────────────────────
  const template = useMemo(
    () => getTemplate(`${family}_${format}`),
    [family, format],
  );

  const palette = useMemo(() => {
    if (paletteId === "custom") {
      // Use saffron as the structural base, swap the accent pair.
      return withAccent(PALETTES.saffron, customAccent);
    }
    return PALETTES[paletteId];
  }, [paletteId, customAccent]);

  const isRunning = status === "running";
  const isComplete = status === "complete";
  const isQuotaExhausted = mockQuotaUsed >= FREE_TIER_LIMIT;

  const activeCopy =
    variants.length === 3
      ? (variants[selectedVariantIndex] ?? DEFAULT_COPY[language])
      : extractedProduct
        ? {
            headline: extractedProduct.productName,
            subheadline:
              extractedProduct.productDesc.slice(0, 120) ||
              "Tap Generate to write copy",
            cta: "",
          }
        : DEFAULT_COPY[language];

  const activeImageUrl = extractedProduct?.productImageUrl ?? SAMPLE_IMAGE;

  // ── Actions ──────────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (isQuotaExhausted) {
      setPlanModalOpen(true);
      return;
    }
    start();
    setMockQuotaUsed((n) => n + 1);
  };

  // ── Power-user shortcuts (preserved from previous shell) ─────────────
  useShortcuts([
    {
      keys: "g",
      description: "Generate copy",
      handler: () => {
        if (!isRunning && !isComplete) handleGenerate();
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

  // ── Render ───────────────────────────────────────────────────────────
  if (!template) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-body text-destructive">
          Couldn't load template "{family}_{format}".
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="grid gap-5 lg:grid-cols-[300px_1fr_360px]"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Left rail — source ──────────────────────────────────────── */}
        <aside className="bg-card border border-border rounded-2xl flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-h3 leading-none">Source</p>
            <p className="text-caption mt-1">
              Drop a photo or paste a product URL — we extract everything else.
            </p>
          </div>
          <div className="px-5 py-5 flex-1">
            <InputForm
              value={inputValue}
              onChange={setInputValue}
              onProductExtracted={setExtractedProduct}
              onRequestManualEntry={(hint) => {
                setManualHint(hint);
                setManualOpen(true);
              }}
            />
          </div>
          {extractedProduct ? (
            <div className="px-5 py-3 border-t border-border bg-background/40">
              <p className="text-label mb-1.5">Detected</p>
              <p
                className="text-body-sm font-medium truncate"
                title={extractedProduct.productName}
              >
                {extractedProduct.productName}
              </p>
              <p
                className="text-caption truncate"
                title={extractedProduct.productDesc}
              >
                {extractedProduct.productDesc.slice(0, 80) || "—"}
              </p>
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-border bg-background/40">
              <p className="text-caption">
                Once a source is added, the canvas updates live.
              </p>
            </div>
          )}
        </aside>

        {/* ── Center — canvas ─────────────────────────────────────────── */}
        <CanvasPreview
          template={template}
          productImageUrl={activeImageUrl}
          copy={activeCopy}
          language={language}
          paletteOverride={palette}
          watermark={plan === "free"}
          variants={variants}
          selectedVariantIndex={selectedVariantIndex}
          onSelectVariant={setSelectedVariantIndex}
          generationRunning={isRunning}
          generationComplete={isComplete}
          steps={steps}
          onReset={reset}
        />

        {/* ── Right rail — inspector ──────────────────────────────────── */}
        <Inspector
          state={
            {
              family,
              format,
              language,
              tone,
              paletteId,
              customAccent,
            } satisfies InspectorState
          }
          actions={{
            setFamily,
            setFormat,
            setLanguage: (l) => {
              setLanguage(l);
              reset();
            },
            setTone,
            setPaletteId,
            setCustomAccent,
            onGenerate: handleGenerate,
            generateLabel: isRunning
              ? "Generating…"
              : isComplete
                ? "Generated"
                : isQuotaExhausted
                  ? "Upgrade to keep going"
                  : "Generate copy",
            generateBusy: isRunning,
            generateDisabled: isRunning || isComplete,
          }}
        />
      </motion.div>

      <ManualEntryDialog
        open={manualOpen}
        hint={manualHint}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) setManualHint(null);
        }}
        onSubmit={(product) => setExtractedProduct(product)}
      />

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
