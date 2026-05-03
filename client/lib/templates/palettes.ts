/**
 * Brand palette presets.
 *
 * Each template ships with a default palette. The user can also override
 * the accent + accentInk pair via the brand-colour picker — the renderer
 * resolves palette tokens (`@accent`, `@ink`, etc.) at draw time so the
 * whole composition repaints in one swap.
 */
import type { Palette } from "./types";

export const PALETTES = {
  /** Saffron on near-black — the house brand. */
  saffron: {
    paper: "#0F0F12",
    ink: "#FFFFFF",
    mute: "#A1A1AA",
    accent: "#FF9D3D",
    accentInk: "#1B0E04",
    surface: "#1A1A1F",
  },
  /** Marigold + ink — warm, agency-photo-shoot look. */
  marigold: {
    paper: "#FFF7ED",
    ink: "#1B1410",
    mute: "#7C6F62",
    accent: "#E8A23A",
    accentInk: "#1B1410",
    surface: "#FBE9CC",
  },
  /** Indigo on bone — premium, fashion catalogue. */
  indigo: {
    paper: "#F4F2EE",
    ink: "#0E0F1A",
    mute: "#5F6175",
    accent: "#3340B0",
    accentInk: "#FFFFFF",
    surface: "#E6E3DC",
  },
  /** Crimson on cream — urgency / sale-cadence without being garish. */
  crimson: {
    paper: "#F5EFE6",
    ink: "#1B0B0B",
    mute: "#7A5F5C",
    accent: "#C8323F",
    accentInk: "#FFFFFF",
    surface: "#EBE0CF",
  },
  /** All ink — minimal, mono — pure editorial. */
  monoLight: {
    paper: "#F2EFEA",
    ink: "#161616",
    mute: "#5C5C5C",
    accent: "#161616",
    accentInk: "#F2EFEA",
    surface: "#E6E2DA",
  },
} as const satisfies Record<string, Palette>;

export type PaletteId = keyof typeof PALETTES;

export const PALETTE_IDS = Object.keys(PALETTES) as readonly PaletteId[];

export const PALETTE_LABELS: Record<PaletteId, string> = {
  saffron: "Saffron",
  marigold: "Marigold",
  indigo: "Indigo",
  crimson: "Crimson",
  monoLight: "Mono",
};

export function getPalette(id: PaletteId): Palette {
  return PALETTES[id];
}

/**
 * Resolve a colour string against the active palette. Tokens look like
 * `@accent`. Anything else is passed through.
 */
export function resolveColour(value: string, palette: Palette): string {
  if (!value.startsWith("@")) return value;
  const key = value.slice(1) as keyof Palette;
  return palette[key] ?? value;
}

/**
 * Build a custom palette by swapping the accent pair on a base preset.
 * The picker uses this so users can supply a hex without redefining
 * paper/ink/mute.
 */
export function withAccent(
  base: Palette,
  accent: string,
  accentInk?: string,
): Palette {
  return {
    ...base,
    accent,
    accentInk: accentInk ?? autoAccentInk(accent),
  };
}

/** Pick black or white text against an arbitrary hex accent. */
export function autoAccentInk(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 3 && normalized.length !== 6) return "#FFFFFF";
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  // Relative luminance, sRGB approximation.
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#0F0F12" : "#FFFFFF";
}
