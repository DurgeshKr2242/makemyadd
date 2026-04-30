// client/app/(marketing)/templates/templates-grid.tsx
"use client";

import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { Badge } from "@/components/ui/badge";
import type { TemplateConfig } from "@/lib/templates/types";

const SAMPLE = {
  headline: "Festival Sale",
  subheadline: "Limited time · Free delivery",
  cta: "Shop Now",
};

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' rx='32' fill='%23e5e7eb'/><text x='50%25' y='52%25' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23111'>Sample</text></svg>`,
  );

export function TemplatesGrid({
  templates,
}: {
  templates: readonly TemplateConfig[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <article
          key={t.id}
          className="bg-card border border-border rounded-2xl p-6 hover:bg-accent transition-colors duration-fast"
        >
          <div className="flex justify-center mb-4">
            <FabricCanvas
              template={t}
              productImageUrl={SAMPLE_IMAGE}
              copy={SAMPLE}
              language="en"
              displayWidth={280}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium">{t.name}</span>
            <Badge
              variant="outline"
              className="font-mono uppercase text-[10px] tracking-wider"
            >
              {t.format}
            </Badge>
          </div>
          <p className="text-caption capitalize mt-1">{t.category}</p>
        </article>
      ))}
    </div>
  );
}
