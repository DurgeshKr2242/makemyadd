// client/app/(dashboard)/dashboard/canvas-preview.tsx
"use client";

import { useState } from "react";

import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { TemplateSelector } from "@/components/canvas/TemplateSelector";
import { CopyVariants } from "@/components/generate/copy-variants";
import { LanguagePicker } from "@/components/generate/language-picker";
import { ProgressStepper } from "@/components/generate/progress-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMockGeneration } from "@/lib/generate/use-mock-generation";
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

export interface CanvasPreviewProps {
  templates: readonly TemplateConfig[];
  defaultTemplateId: string;
}

export function CanvasPreview({
  templates,
  defaultTemplateId,
}: CanvasPreviewProps) {
  const [tplId, setTplId] = useState(defaultTemplateId);
  const [language, setLanguage] = useState<Language>("hi");
  const [tone, setTone] = useState<Tone>("festive");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const { status, steps, variants, start, reset } = useMockGeneration(language);

  const tpl = templates.find((t) => t.id === tplId) ?? templates[0];

  const activeCopy =
    variants.length === 3
      ? (variants[selectedVariantIndex] ?? DEFAULT_COPY[language])
      : DEFAULT_COPY[language];

  const isRunning = status === "running";
  const isComplete = status === "complete";

  return (
    <div className="space-y-5">
      {/* Language & tone picker */}
      <LanguagePicker
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          reset();
        }}
        tone={tone}
        onToneChange={setTone}
      />

      {/* Progress stepper — visible while running */}
      {isRunning && (
        <div className="bg-card border border-border rounded-2xl px-5 py-4">
          <p className="text-label mb-4">Generating</p>
          <ProgressStepper steps={steps} />
        </div>
      )}

      {/* Canvas card */}
      <div className="spotlight-card relative bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <p className="text-label">Live preview</p>
          <Badge
            variant="outline"
            className="font-mono uppercase text-[10px] tracking-wider"
          >
            {tpl?.format} · {tpl?.canvas.width}
          </Badge>
        </div>

        <div className="flex justify-center">
          {tpl ? (
            <FabricCanvas
              template={tpl}
              productImageUrl={SAMPLE_IMAGE}
              copy={activeCopy}
              language={language}
              displayWidth={420}
            />
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="outline" disabled>
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
          ) : (
            <Button onClick={start} disabled={isRunning} aria-busy={isRunning}>
              {isRunning ? "Generating…" : "Generate copy"}
            </Button>
          )}
        </div>
      </div>

      {/* Copy variants — visible once generation is complete */}
      {isComplete && variants.length === 3 && (
        <CopyVariants
          variants={variants}
          selectedIndex={selectedVariantIndex}
          onSelect={setSelectedVariantIndex}
          language={language}
        />
      )}

      {/* Template selector */}
      <div>
        <p className="text-label mb-3">Template</p>
        <TemplateSelector
          templates={templates}
          value={tpl?.id ?? ""}
          onChange={setTplId}
        />
      </div>
    </div>
  );
}
