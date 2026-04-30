"use client";

import { useState } from "react";

import { InputForm, type InputValue } from "@/components/generate/input-form";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { TEMPLATES } from "@/lib/templates/registry";

import { CanvasPreview } from "./canvas-preview";
import { Step } from "./step";

export function DashboardShell() {
  const [inputValue, setInputValue] = useState<InputValue>({ type: "empty" });
  const [extractedProduct, setExtractedProduct] =
    useState<ExtractResponse | null>(null);

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
              if (v.type === "empty") setExtractedProduct(null);
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
