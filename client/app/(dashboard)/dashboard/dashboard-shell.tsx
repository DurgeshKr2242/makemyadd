"use client";

import { useEffect, useState } from "react";

import { InputForm, type InputValue } from "@/components/generate/input-form";
import {
  ManualEntryDialog,
  type ManualEntryHint,
} from "@/components/generate/manual-entry-dialog";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { TEMPLATES } from "@/lib/templates/registry";

import { CanvasPreview } from "./canvas-preview";
import { Step } from "./step";

export function DashboardShell() {
  const [inputValue, setInputValue] = useState<InputValue>({ type: "empty" });
  const [extractedProduct, setExtractedProduct] =
    useState<ExtractResponse | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualHint, setManualHint] = useState<ManualEntryHint | null>(null);

  // Mirror file uploads into extractedProduct — symmetric with the URL flow.
  // When type === "url", the UrlPane's onProductExtracted callback handles it.
  useEffect(() => {
    if (inputValue.type === "file") {
      // Local-preview-only state, before R2 upload completes.
      setExtractedProduct({
        productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
        productDesc: `${(inputValue.file.size / 1024).toFixed(0)} KB · ${inputValue.file.type}`,
        productImageUrl: inputValue.previewUrl,
      });
    } else if (inputValue.type === "uploaded") {
      // Upload finished — fire photo extraction.
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
          // Keep the file-stage placeholder visible regardless — better UX
          // than blanking the preview.
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
    // type === "url" — handled by UrlPane's onProductExtracted callback
  }, [inputValue]);

  return (
    <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
      {/* Left — input column */}
      <div className="space-y-6">
        <Step
          n="01"
          title="Product"
          body="Upload an image or paste a product URL"
        >
          <InputForm
            value={inputValue}
            onChange={(v) => {
              setInputValue(v);
            }}
            onProductExtracted={setExtractedProduct}
            onRequestManualEntry={(hint) => {
              setManualHint(hint);
              setManualOpen(true);
            }}
          />
        </Step>

        <Step
          n="02"
          title="Language & tone"
          body="Native script, never translated"
        >
          <p className="text-caption">Picker lives inside the preview card →</p>
        </Step>

        <Step
          n="03"
          title="Template"
          body="Pick a starting point — switch anytime"
        >
          <p className="text-caption">
            Selector lives inside the preview card →
          </p>
        </Step>
      </div>

      {/* Right — preview */}
      <div>
        <div className="sticky top-20">
          <CanvasPreview
            templates={TEMPLATES}
            defaultTemplateId={TEMPLATES[0]?.id ?? ""}
            extractedProduct={extractedProduct}
          />
        </div>
      </div>

      <ManualEntryDialog
        open={manualOpen}
        hint={manualHint}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) setManualHint(null);
        }}
        onSubmit={(product) => setExtractedProduct(product)}
      />
    </div>
  );
}
