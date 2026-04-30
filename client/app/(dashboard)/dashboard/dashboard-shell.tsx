"use client";

import { useEffect, useState } from "react";

import { InputForm, type InputValue } from "@/components/generate/input-form";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { TEMPLATES } from "@/lib/templates/registry";

import { CanvasPreview } from "./canvas-preview";
import { Step } from "./step";

export function DashboardShell() {
  const [inputValue, setInputValue] = useState<InputValue>({ type: "empty" });
  const [extractedProduct, setExtractedProduct] =
    useState<ExtractResponse | null>(null);

  // Mirror file uploads into extractedProduct — symmetric with the URL flow.
  // When type === "url", the UrlPane's onProductExtracted callback handles it.
  useEffect(() => {
    if (inputValue.type === "file") {
      setExtractedProduct({
        productName: inputValue.file.name.replace(/\.[^.]+$/, ""),
        productDesc: `${(inputValue.file.size / 1024).toFixed(0)} KB · ${inputValue.file.type}`,
        productImageUrl: inputValue.previewUrl,
      });
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
    </div>
  );
}
