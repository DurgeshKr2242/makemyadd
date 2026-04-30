import { useCallback, useState } from "react";

import type { CopyVariant } from "@/components/generate/copy-variants";
import type {
  ProgressStep,
  StepKey,
} from "@/components/generate/progress-stepper";
import type { Language } from "@/lib/types";

type GenerationStatus = "idle" | "running" | "complete" | "failed";

const STEPS_INIT: ProgressStep[] = [
  { key: "upload", label: "Upload", status: "pending" },
  { key: "extract", label: "Extract", status: "pending" },
  { key: "bgremove", label: "Remove background", status: "pending" },
  { key: "copy", label: "Generate copy", status: "pending" },
  { key: "render", label: "Render", status: "pending" },
  { key: "done", label: "Done", status: "pending" },
];

// Per-language fake copy. Real one comes from Groq later.
const FAKE_VARIANTS: Record<Language, CopyVariant[]> = {
  en: [
    {
      headline: "Festival Sale",
      subheadline: "Limited time · Free delivery",
      cta: "Shop Now",
    },
    {
      headline: "New Arrivals",
      subheadline: "Hand-picked just for you",
      cta: "Discover",
    },
    {
      headline: "Save 25% Today",
      subheadline: "Use code FEST25 at checkout",
      cta: "Claim Offer",
    },
  ],
  hi: [
    {
      headline: "त्योहारी सेल",
      subheadline: "सीमित समय · फ्री डिलीवरी",
      cta: "अभी खरीदें",
    },
    {
      headline: "नई कलेक्शन",
      subheadline: "खासतौर पर आपके लिए चुनी गई",
      cta: "देखें",
    },
    {
      headline: "आज 25% बचाएँ",
      subheadline: "कोड FEST25 का उपयोग करें",
      cta: "ऑफर लें",
    },
  ],
  ta: [
    {
      headline: "திருவிழா சலுகை",
      subheadline: "வரம்பிலான நேரம் · இலவச டெலிவரி",
      cta: "இன்றே வாங்கு",
    },
    {
      headline: "புதிய வரவு",
      subheadline: "உங்களுக்காகவே தேர்ந்தெடுத்தது",
      cta: "பார்க்கவும்",
    },
    {
      headline: "இன்று 25% சேமி",
      subheadline: "FEST25 குறியீட்டை பயன்படுத்தவும்",
      cta: "பெறுக",
    },
  ],
  te: [
    {
      headline: "పండుగ సేల్",
      subheadline: "పరిమిత సమయం · ఉచిత డెలివరీ",
      cta: "ఇప్పుడే కొనండి",
    },
    { headline: "కొత్త కలెక్షన్", subheadline: "ప్రత్యేకంగా మీ కోసం", cta: "చూడండి" },
    {
      headline: "ఈరోజు 25% ఆదా",
      subheadline: "FEST25 కోడ్ ఉపయోగించండి",
      cta: "ఆఫర్ తీసుకోండి",
    },
  ],
};

export interface UseMockGeneration {
  status: GenerationStatus;
  steps: ProgressStep[];
  variants: readonly CopyVariant[];
  start: () => void;
  reset: () => void;
}

export function useMockGeneration(language: Language): UseMockGeneration {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [steps, setSteps] = useState<ProgressStep[]>(STEPS_INIT);
  const [variants, setVariants] = useState<readonly CopyVariant[]>([]);

  const reset = useCallback(() => {
    setStatus("idle");
    setSteps(STEPS_INIT);
    setVariants([]);
  }, []);

  const start = useCallback(() => {
    if (status === "running") return;
    setStatus("running");
    setSteps(STEPS_INIT);
    setVariants([]);

    const order: StepKey[] = [
      "upload",
      "extract",
      "bgremove",
      "copy",
      "render",
      "done",
    ];
    // Realistic timings per spec §12: upload 600ms, extract 800ms,
    // bgremove 2200ms (the slow one), copy 900ms, render 400ms, done 200ms.
    const delays: number[] = [600, 800, 2200, 900, 400, 200];
    let i = 0;

    const tick = () => {
      if (i >= order.length) {
        setVariants(FAKE_VARIANTS[language]);
        setStatus("complete");
        return;
      }
      const current = order[i];
      // Mark current as running, previous as done
      setSteps((prev) =>
        prev.map((s) => {
          if (s.key === current) return { ...s, status: "running" };
          const idx = order.indexOf(s.key);
          if (idx < i) return { ...s, status: "done" };
          return s;
        }),
      );
      const delay = delays[i] ?? 500;
      i += 1;
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) => (s.key === current ? { ...s, status: "done" } : s)),
        );
        tick();
      }, delay);
    };

    tick();
  }, [language, status]);

  return { status, steps, variants, start, reset };
}
