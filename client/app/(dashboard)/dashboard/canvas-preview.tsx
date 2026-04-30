// client/app/(dashboard)/dashboard/canvas-preview.tsx
"use client";

import { useState } from "react";

import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { TemplateSelector } from "@/components/canvas/TemplateSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TemplateConfig } from "@/lib/templates/types";
import type { Language } from "@/lib/types";

const SAMPLE_COPY: Record<
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
  templates: TemplateConfig[];
  defaultTemplateId: string;
  language: Language;
}

export function CanvasPreview({
  templates,
  defaultTemplateId,
  language,
}: CanvasPreviewProps) {
  const [tplId, setTplId] = useState(defaultTemplateId);
  const tpl = templates.find((t) => t.id === tplId) ?? templates[0];

  return (
    <div className="space-y-5">
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
              copy={SAMPLE_COPY[language]}
              language={language}
              displayWidth={420}
            />
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" disabled>
            Download
          </Button>
          <Button disabled>Generate copy</Button>
        </div>
      </div>

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
