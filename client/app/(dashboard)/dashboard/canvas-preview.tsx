// client/app/(dashboard)/dashboard/canvas-preview.tsx
"use client";

import { Download, Loader2, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { toast } from "sonner";

import {
  FabricCanvas,
  type FabricCanvasHandle,
} from "@/components/canvas/FabricCanvas";
import type { CopyVariant } from "@/components/generate/copy-variants";
import type { ProgressStep } from "@/components/generate/progress-stepper";
import { ProgressStepper } from "@/components/generate/progress-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Palette, TemplateConfig } from "@/lib/templates/types";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CanvasPreviewProps {
  template: TemplateConfig;
  productImageUrl: string;
  copy: { headline: string; subheadline: string; cta: string };
  language: Language;
  paletteOverride: Palette;
  watermark: boolean;

  // Copy variants — null until first run completes.
  variants: readonly CopyVariant[];
  selectedVariantIndex: number;
  onSelectVariant: (i: number) => void;

  // Generation status — drives the overlay.
  generationRunning: boolean;
  generationComplete: boolean;
  steps: ProgressStep[];

  onReset: () => void;
}

export function CanvasPreview({
  template,
  productImageUrl,
  copy,
  language,
  paletteOverride,
  watermark,
  variants,
  selectedVariantIndex,
  onSelectVariant,
  generationRunning,
  generationComplete,
  steps,
  onReset,
}: CanvasPreviewProps) {
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const reducedMotion = useReducedMotion();

  const handleDownload = () => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const slug = (copy.headline || template.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    const filename = `adcreator-${slug || "ad"}-${ts}`;
    const ok = canvasRef.current?.download(filename) ?? false;
    if (ok) {
      toast.success("Downloaded", {
        description: `${filename}.png saved.`,
      });
    } else {
      toast.error("Download failed", {
        description: "Canvas wasn't ready. Try again.",
      });
    }
  };

  // Display width of the canvas — Indic-friendly: square gets the largest
  // breathing room; story/portrait scale down to fit the column.
  const displayWidth =
    template.format === "9x16" ? 320 : template.format === "4x5" ? 380 : 480;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Toolbar — variant tabs, format pill, watermark */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-label">Live preview</span>
          {watermark ? (
            <Badge
              variant="outline"
              className="bg-warning/10 text-warning font-mono uppercase text-[10px] tracking-wider"
            >
              Watermark
            </Badge>
          ) : null}
        </div>
        {variants.length > 0 ? (
          <div
            role="tablist"
            aria-label="Copy variants"
            className="inline-flex items-center gap-1 bg-background border border-border rounded-md p-0.5"
          >
            {variants.map((v, i) => {
              const active = i === selectedVariantIndex;
              return (
                <button
                  key={v.headline}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectVariant(i)}
                  className={cn(
                    "h-6 min-w-[36px] px-2 rounded text-mono tabular text-[11px] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  V{i + 1}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Canvas stage — gradient backdrop, breathing room */}
      <div className="relative flex-1 flex items-center justify-center px-6 py-10 sm:py-14 gradient-spotlight">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.32,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative"
        >
          <FabricCanvas
            ref={canvasRef}
            template={template}
            productImageUrl={productImageUrl}
            copy={copy}
            language={language}
            paletteOverride={paletteOverride}
            watermark={watermark}
            displayWidth={displayWidth}
            className="ring-1 ring-border rounded-md shadow-lg"
          />

          {/* Generation overlay — semi-transparent scrim with stepper */}
          {generationRunning ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-end justify-center bg-background/40 backdrop-blur-sm rounded-md"
            >
              <div className="m-4 w-full max-w-sm bg-popover/90 backdrop-blur border border-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-label">Generating</p>
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-primary"
                    strokeWidth={2.5}
                  />
                </div>
                <ProgressStepper steps={steps} />
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </div>

      {/* Action row — download primary, reset secondary, copy hint */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-background/40">
        <div className="flex items-center gap-2 min-w-0">
          {generationComplete ? (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Regenerate
            </Button>
          ) : (
            <span className="text-caption hidden sm:inline">
              Pick a template, then generate copy
            </span>
          )}
        </div>
        <Button onClick={handleDownload} size="sm" variant="secondary">
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          Download .png
        </Button>
      </div>
    </div>
  );
}
