// client/components/canvas/TemplateSelector.tsx
"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TemplateConfig } from "@/lib/templates/types";

export interface TemplateSelectorProps {
  templates: TemplateConfig[];
  value: string;
  onChange: (id: string) => void;
}

export function TemplateSelector({
  templates,
  value,
  onChange,
}: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {templates.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`group relative aspect-square rounded-xl border bg-card overflow-hidden transition-all duration-fast ${
              selected
                ? "border-primary shadow-glow"
                : "border-border hover:border-input"
            }`}
            aria-pressed={selected}
          >
            <div
              className="absolute inset-0"
              style={{ background: t.canvas.background }}
            />
            <div className="absolute inset-0 flex items-end justify-between p-3">
              <Badge
                variant="outline"
                className="bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider font-mono"
              >
                {t.format}
              </Badge>
              {selected ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
            <span className="sr-only">{t.id}</span>
          </button>
        );
      })}
    </div>
  );
}
