import type { Language } from "@/lib/types";

export interface GoogleFontDescriptor {
  /** key used in the URL: /api/fonts/[family] */
  slug: string;
  /** css font-family value Fabric will use */
  cssName: string;
  /** Google fonts query string after `family=` */
  googleQuery: string;
}

/** Languages → Noto family. Used by both the canvas renderer and the font
 *  proxy route. The key matches `Language` so we never hardcode strings. */
export const FONT_FAMILIES: Record<Language, GoogleFontDescriptor> = {
  en: {
    slug: "noto-sans",
    cssName: "Noto Sans",
    googleQuery: "Noto+Sans:wght@400;500;700",
  },
  hi: {
    slug: "noto-sans-devanagari",
    cssName: "Noto Sans Devanagari",
    googleQuery: "Noto+Sans+Devanagari:wght@400;500;700",
  },
  ta: {
    slug: "noto-sans-tamil",
    cssName: "Noto Sans Tamil",
    googleQuery: "Noto+Sans+Tamil:wght@400;500;700",
  },
  te: {
    slug: "noto-sans-telugu",
    cssName: "Noto Sans Telugu",
    googleQuery: "Noto+Sans+Telugu:wght@400;500;700",
  },
};

/** Reverse lookup by slug for the route handler. */
export function findFamilyBySlug(
  slug: string,
): GoogleFontDescriptor | undefined {
  return Object.values(FONT_FAMILIES).find((f) => f.slug === slug);
}
