/**
 * Template engine types — TODO §11.1.
 *
 * Each template is a pure JSON config rendered client-side by Fabric.js.
 * No server-side image generation. The renderer is in
 * `components/canvas/FabricCanvas.tsx`.
 *
 * The engine speaks two languages:
 *   1. Coordinates in pixels at canvas-native resolution (1080 wide).
 *   2. Colors in hex *or* a palette token (`@accent`, `@ink`, `@paper`,
 *      `@accentInk`, `@mute`, `@surface`). Tokens are resolved at render
 *      time against the template's palette, which itself can be overridden
 *      by the user (brand color picker).
 *
 * That gives us one config that adapts to four palette presets without
 * duplicating layouts — the engineering the dashboard advertises.
 */
import type { Format, TemplateCategory } from "@/lib/types";

/**
 * Palette tokens. Templates reference these instead of hex literals so a
 * single brand-color swap repaints the whole composition consistently.
 */
export interface Palette {
  /** Page surface — what the bulk of the canvas reads as. */
  paper: string;
  /** Ink on paper — primary text colour. */
  ink: string;
  /** Subdued ink — captions, brand line. */
  mute: string;
  /** Brand accent — CTAs, badges, the editorial moment. */
  accent: string;
  /** Text that sits on top of an `accent` fill (high contrast). */
  accentInk: string;
  /** Slight surface lift — used for chips and CTA backgrounds when the
   *  page is already accent-heavy. */
  surface: string;
}

export type PaletteToken = keyof Palette;

/** Either a `#rrggbb` hex string or a palette reference like `@accent`. */
export type Colour = string;

export interface TemplateConfig {
  id: string;
  name: string;
  /** Human-readable one-liner — shown in the gallery hover and on the
   *  marketing /templates page. */
  description: string;
  format: Format;
  category: TemplateCategory;
  /** Tags for search/filter, e.g. "editorial", "punchy", "minimal". */
  tags?: readonly string[];
  /** Default palette baked into the template. The user can override the
   *  accent + accentInk pair via the brand-color picker. */
  palette: Palette;
  canvas: { width: number; height: number; background: Colour };
  layers: Layer[];
}

export type Layer =
  | RectLayer
  | GradientLayer
  | ScrimLayer
  | ProductLayer
  | TextLayer
  | CtaButtonLayer
  | DividerLayer
  | LogoLayer;

export interface RectLayer {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: Colour;
  rx?: number;
}

/** Two-stop linear gradient. Direction in degrees; 0 = top→bottom, 90 =
 *  left→right. */
export interface GradientLayer {
  type: "gradient";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees, 0 = top→bottom (default). */
  angle?: number;
  /** Stops, normalized 0–1, with their colour. */
  stops: readonly { offset: number; color: Colour }[];
  rx?: number;
}

/** Vertical legibility scrim — alpha gradient anchored to either edge so
 *  text on top of a photo always reads. Direction is "top" → fade-from-top
 *  or "bottom" → fade-from-bottom. */
export interface ScrimLayer {
  type: "scrim";
  x: number;
  y: number;
  w: number;
  h: number;
  /** "bottom" puts opaque at the bottom, fading up. "top" inverse. */
  from: "top" | "bottom";
  /** Hex of the scrim colour, defaults to #000. */
  colour?: Colour;
  /** Max alpha at the opaque edge, 0–1. Defaults to 0.7. */
  alpha?: number;
}

export interface ProductLayer {
  type: "product";
  x: number;
  y: number;
  w: number;
  h: number;
  /** "contain" letterboxes inside the box. "cover" crops to fill. */
  fit?: "contain" | "cover";
  /** "rounded" applies a corner radius. "circle" masks to a circle. */
  mask?: "none" | "rounded" | "circle";
  /** Corner radius in px when mask = "rounded". */
  cornerRadius?: number;
  /** Drop shadow under the product. */
  shadow?: boolean;
}

export type TextKey = "headline" | "subheadline" | "cta" | "brand";

export interface TextLayer {
  type: "text";
  /** Which copy field. `brand` uses the template's brand mark string. */
  key: TextKey;
  x: number;
  y: number;
  /** Box width. Wraps + auto-fits within this. */
  maxWidth: number;
  /** Optional max height. When set, text shrinks until it fits both. */
  maxHeight?: number;
  /** Starting font size. Auto-fit can shrink this when needed. */
  fontSize: number;
  /** Floor for auto-fit. Defaults to 60% of `fontSize`. */
  minFontSize?: number;
  fontFamily: string;
  fill: Colour;
  fontWeight?: "400" | "500" | "600" | "700";
  textAlign?: "left" | "center" | "right";
  /** "wrap" only wraps. "shrink" wraps AND scales font down to fit. */
  fitMode?: "wrap" | "shrink";
  /** Line-height multiplier (default 1.16). */
  lineHeight?: number;
  /** Letter-spacing in px (default 0). */
  letterSpacing?: number;
  /** Uppercase the rendered string — useful for brand marks / labels. */
  uppercase?: boolean;
  /** Static fallback string used when the copy field is empty (e.g. for
   *  the brand mark). */
  staticText?: string;
}

export interface CtaButtonLayer {
  type: "cta_btn";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: Colour;
  rx: number;
  /** Hides the entire button (background + paired text) when the matching
   *  copy field is empty. Default: true. */
  hideWhenEmpty?: boolean;
  /** Which copy field this button is paired with — used to know whether
   *  to hide. Defaults to "cta". */
  pairedWith?: TextKey;
}

/** Hairline divider — useful for editorial/magazine layouts. */
export interface DividerLayer {
  type: "divider";
  x: number;
  y: number;
  w: number;
  /** Stroke thickness in px. */
  thickness?: number;
  fill: Colour;
}

/** Reserved for the brand-kit logo image (lands with §14 Phase 2). */
export interface LogoLayer {
  type: "logo";
  x: number;
  y: number;
  w: number;
  h: number;
}
