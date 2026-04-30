/**
 * Shared OG image renderer. Used by app/opengraph-image.tsx (English
 * default) and app/og/{hi,ta,te}/route.tsx (per-language variants).
 *
 * Edge runtime — fonts are fetched from gstatic at request time. The
 * Noto family per language ships the correct script glyphs; using
 * Geist for non-Latin would tofu.
 */
import { ImageResponse } from "next/og";

export type OgLanguage = "en" | "hi" | "ta" | "te";

interface LangCopy {
  // Headline split into two visually balanced lines
  line1: string;
  line2: string;
  sub: string;
  cta: string;
  fontFamilyForData: string; // matches the woff2 fetched per language
}

const COPY: Record<OgLanguage, LangCopy> = {
  en: {
    line1: "Studio-quality ads",
    line2: "in 30 seconds.",
    sub: "English · हिन्दी · தமிழ் · తెలుగు",
    cta: "adcreator.in",
    fontFamilyForData: "Geist",
  },
  hi: {
    line1: "स्टूडियो-क्वालिटी विज्ञापन",
    line2: "30 सेकंड में।",
    sub: "हिन्दी, तमिल, तेलुगु और अंग्रेज़ी में",
    cta: "adcreator.in",
    fontFamilyForData: "Noto Sans Devanagari",
  },
  ta: {
    line1: "ஸ்டுடியோ-தர விளம்பரங்கள்",
    line2: "30 விநாடிகளில்.",
    sub: "ஆங்கிலம் · இந்தி · தமிழ் · தெலுங்கு",
    cta: "adcreator.in",
    fontFamilyForData: "Noto Sans Tamil",
  },
  te: {
    line1: "స్టూడియో-నాణ్యత ప్రకటనలు",
    line2: "30 సెకన్లలో.",
    sub: "ఇంగ్లీష్ · హిందీ · తమిళం · తెలుగు",
    cta: "adcreator.in",
    fontFamilyForData: "Noto Sans Telugu",
  },
};

const FONT_URL: Record<OgLanguage, string> = {
  // Latin — Geist 500. Fixed gstatic woff2 path; if Google rotates,
  // refresh from https://fonts.googleapis.com/css2?family=Geist:wght@500
  en: "https://fonts.gstatic.com/s/geist/v3/gyByhwUxId8gMEwYGFU2cs0_a.woff2",
  // Indic — Noto Sans 600 in each script. These are stable file URLs.
  hi: "https://fonts.gstatic.com/s/notosansdevanagari/v26/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly-AzoFoW4Ow.woff2",
  ta: "https://fonts.gstatic.com/s/notosanstamil/v27/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7vGo70RqKDt_EvT.woff2",
  te: "https://fonts.gstatic.com/s/notosanstelugu/v26/0FlxVOGZlE2Rrtr-HmgkMWJNjJ5_RyT8o8c7fHkeg-esVC5dzHkHIJQqrEntezbqQUbf-3v37w.woff2",
};

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export async function renderOg(language: OgLanguage): Promise<ImageResponse> {
  const copy = COPY[language];
  const fontData = await fetch(FONT_URL[language]).then((r) => r.arrayBuffer());

  return new ImageResponse(
    <div
      lang={language}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#0a0a14",
        color: "#fafafa",
        fontFamily: copy.fontFamilyForData,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "#FF7A2E",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 600,
            color: "#1a0e02",
          }}
        >
          ★
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: -0.5 }}>
          AdCreator
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 18,
            color: "#a1a1aa",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {language.toUpperCase()}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: -2.5,
            lineHeight: 1.05,
            maxWidth: 1040,
          }}
        >
          {copy.line1}
          <br />
          {copy.line2}
        </div>
        <div style={{ fontSize: 26, color: "#a1a1aa", maxWidth: 1040 }}>
          {copy.sub}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            fontSize: 22,
            color: "#FF7A2E",
            border: "1px solid rgba(255, 122, 46, 0.35)",
            borderRadius: 999,
            padding: "8px 18px",
          }}
        >
          {copy.cta}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        {
          name: copy.fontFamilyForData,
          data: fontData,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
