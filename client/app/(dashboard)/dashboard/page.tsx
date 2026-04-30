"use client";

import { useState } from "react";

import { InputForm, type InputValue } from "@/components/generate/input-form";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates/registry";

import { CanvasPreview } from "./canvas-preview";

// Note: metadata export moved to a server component wrapper.
// "use client" + metadata is invalid in Next.js App Router —
// InputForm state must live here, so we accept no static metadata.

export default function DashboardPage() {
  const [productInput, setProductInput] = useState<InputValue>({
    type: "empty",
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-label mb-3">Studio</p>
          <h1 className="text-h1">
            Make a <span className="text-serif text-primary">new</span> ad.
          </h1>
          <p className="text-body text-muted-foreground mt-3 max-w-xl">
            Drop a product photo or paste a URL — we handle the background, the
            copy, and the composition. Your preview is live in 30 seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Save draft
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
        {/* Left — input column */}
        <div className="space-y-6">
          <Step
            n="01"
            title="Product"
            body="Upload an image or paste a product URL"
          >
            {/* InputForm holds the file/URL state; canvas still uses SAMPLE_IMAGE
                until §5 real upload lands. productInput is available if needed. */}
            <InputForm value={productInput} onChange={setProductInput} />
          </Step>

          <Step
            n="02"
            title="Language & tone"
            body="Native script, never translated"
          >
            <p className="text-caption">Language picker lands with §10.</p>
          </Step>

          <Step
            n="03"
            title="Template"
            body="Pick a starting point — switch anytime"
          >
            <p className="text-caption">Template grid lands with §11.</p>
          </Step>
        </div>

        {/* Right — preview */}
        <div>
          <div className="sticky top-20">
            <CanvasPreview
              templates={TEMPLATES}
              defaultTemplateId={TEMPLATES[0]?.id ?? ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 sm:p-7">
      <div className="flex items-start gap-4 mb-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-mono text-muted-foreground tabular shrink-0">
          {n}
        </span>
        <div>
          <h2 className="text-h3">{title}</h2>
          <p className="text-caption">{body}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
