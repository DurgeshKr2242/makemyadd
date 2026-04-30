import { create } from "zustand";

import type { Language, Tone } from "@/lib/types";

export interface GenerationState {
  // Inputs
  language: Language;
  tone: Tone;
  templateId: string | null;
  selectedVariantIndex: number;

  // Setters
  setLanguage: (l: Language) => void;
  setTone: (t: Tone) => void;
  setTemplateId: (id: string) => void;
  setSelectedVariantIndex: (i: number) => void;
  reset: () => void;
}

const DEFAULTS = {
  language: "hi" as Language,
  tone: "festive" as Tone,
  templateId: null,
  selectedVariantIndex: 0,
};

export const useGenerationStore = create<GenerationState>()((set) => ({
  ...DEFAULTS,
  setLanguage: (language) => set({ language }),
  setTone: (tone) => set({ tone }),
  setTemplateId: (templateId) => set({ templateId }),
  setSelectedVariantIndex: (selectedVariantIndex) =>
    set({ selectedVariantIndex }),
  reset: () => set(DEFAULTS),
}));

// Convenience selector hooks for common combinations — avoids re-renders
// when unrelated state changes.
export const useLanguage = () => useGenerationStore((s) => s.language);
export const useTone = () => useGenerationStore((s) => s.tone);
