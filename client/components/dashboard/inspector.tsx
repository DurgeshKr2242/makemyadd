/**
 * Inspector — the right-rail control panel for the dashboard.
 *
 * Linear-cadence: dense, sectioned, every control sits inline. Sections
 * stack vertically, separated by a hairline. No accordions on desktop —
 * a designer wants every dial visible.
 *
 * Mobile (< lg): the parent collapses this into a `Sheet`.
 */
"use client";

import { Check, Pipette } from "lucide-react";
import { useId } from "react";

import { TemplateThumb } from "@/components/canvas/template-thumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PALETTE_IDS,
  PALETTE_LABELS,
  PALETTES,
  type PaletteId,
} from "@/lib/templates/palettes";
import {
  FORMAT_DIMENSIONS,
  FORMATS,
  type Format,
  LANGUAGE_LABELS,
  LANGUAGES,
  type Language,
  TONES,
  type Tone,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE_LABELS: Record<Tone, string> = {
  festive: "Festive",
  urgent: "Urgent",
  trust: "Trust",
  showcase: "Showcase",
};

export interface InspectorState {
  family: "spotlight" | "editorial";
  format: Format;
  language: Language;
  tone: Tone;
  paletteId: PaletteId | "custom";
  customAccent: string;
}

export interface InspectorActions {
  setFamily: (f: "spotlight" | "editorial") => void;
  setFormat: (f: Format) => void;
  setLanguage: (l: Language) => void;
  setTone: (t: Tone) => void;
  setPaletteId: (id: PaletteId | "custom") => void;
  setCustomAccent: (hex: string) => void;
  onGenerate: () => void;
  generateLabel: string;
  generateBusy?: boolean;
  generateDisabled?: boolean;
}

interface SectionProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

function Section({ label, hint, children, className }: SectionProps) {
  return (
    <section
      className={cn(
        "px-5 py-5 border-b border-border last:border-b-0",
        className,
      )}
    >
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-label">{label}</p>
        {hint ? <span className="text-caption">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Inspector({
  state,
  actions,
}: {
  state: InspectorState;
  actions: InspectorActions;
}) {
  const customId = useId();
  const formatDim = FORMAT_DIMENSIONS[state.format];

  return (
    <aside className="bg-card border border-border rounded-2xl flex flex-col">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <p className="text-h3 leading-none">Inspector</p>
        <span className="text-mono text-muted-foreground tabular">
          {formatDim.width}×{formatDim.height}
        </span>
      </div>

      <Section label="Template">
        <div className="grid grid-cols-2 gap-2">
          {(["spotlight", "editorial"] as const).map((fam) => {
            const active = state.family === fam;
            const palette =
              state.paletteId === "custom"
                ? PALETTES.saffron
                : PALETTES[state.paletteId];
            return (
              <button
                key={fam}
                type="button"
                onClick={() => actions.setFamily(fam)}
                aria-pressed={active}
                className={cn(
                  "group relative flex flex-col items-stretch gap-2 rounded-xl border p-2 text-left transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border bg-background hover:border-input hover:bg-accent",
                )}
              >
                <div className="aspect-square w-full rounded-md overflow-hidden bg-muted/40 flex items-center justify-center">
                  <TemplateThumb
                    family={fam}
                    format={state.format}
                    paletteAccent={
                      state.paletteId === "custom"
                        ? state.customAccent
                        : palette.accent
                    }
                    paletteAccentInk={palette.accentInk}
                    palettePaper={palette.paper}
                    paletteInk={palette.ink}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm capitalize font-medium">
                    {fam}
                  </span>
                  {active ? (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Format">
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATS.map((f) => {
            const active = f === state.format;
            return (
              <button
                key={f}
                type="button"
                onClick={() => actions.setFormat(f)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center justify-center rounded-md border px-2 py-2.5 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span className="text-mono tabular leading-none">{f}</span>
                <span className="text-[10px] tracking-wider uppercase mt-1.5 leading-none">
                  {f === "1x1" ? "Post" : f === "9x16" ? "Story" : "Portrait"}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Language">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => {
            const active = lang === state.language;
            return (
              <button
                key={lang}
                type="button"
                lang={lang}
                onClick={() => actions.setLanguage(lang)}
                aria-pressed={active}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-body-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-accent",
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Tone">
        <Select
          value={state.tone}
          onValueChange={(v) => actions.setTone(v as Tone)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            {TONES.map((t) => (
              <SelectItem key={t} value={t}>
                {TONE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section
        label="Brand colour"
        hint={state.paletteId === "custom" ? state.customAccent : undefined}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {PALETTE_IDS.map((id) => {
            const p = PALETTES[id];
            const active = state.paletteId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => actions.setPaletteId(id)}
                aria-pressed={active}
                aria-label={`${PALETTE_LABELS[id]} palette`}
                className={cn(
                  "relative h-7 w-7 rounded-full border transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-foreground scale-105"
                    : "border-border hover:border-input",
                )}
                style={{
                  background: `linear-gradient(135deg, ${p.accent} 0%, ${p.accent} 50%, ${p.paper} 50%, ${p.paper} 100%)`,
                }}
                title={PALETTE_LABELS[id]}
              >
                {active ? (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-block h-1 w-1 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
          <label
            htmlFor={customId}
            className={cn(
              "relative h-7 w-7 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-fast",
              state.paletteId === "custom"
                ? "border-foreground scale-105"
                : "border-border hover:border-input",
            )}
            style={{ background: state.customAccent }}
            title="Custom colour"
          >
            <Pipette
              className="h-3 w-3 text-white drop-shadow"
              strokeWidth={2}
            />
            <input
              id={customId}
              type="color"
              value={state.customAccent}
              onChange={(e) => {
                actions.setPaletteId("custom");
                actions.setCustomAccent(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Pick a brand colour"
            />
          </label>
        </div>
      </Section>

      <div className="px-5 py-4 mt-auto border-t border-border">
        <Button
          className="w-full"
          size="lg"
          onClick={actions.onGenerate}
          disabled={actions.generateDisabled}
          aria-busy={actions.generateBusy}
        >
          {actions.generateLabel}
        </Button>
        <p className="text-caption mt-2 text-center">
          Generate copy in 30 seconds — three variants per run
        </p>
      </div>
    </aside>
  );
}
