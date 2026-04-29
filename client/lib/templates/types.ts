/**
 * Template engine types — TODO §11.1.
 *
 * Each template is a pure JSON config rendered client-side by Fabric.js.
 * No server-side image generation. The renderer is in
 * `components/canvas/FabricCanvas.tsx` (TODO §11.4).
 */
import type { Format, TemplateCategory } from "@/lib/types";

export interface TemplateConfig {
  id: string;
  format: Format;
  category: TemplateCategory;
  canvas: { width: number; height: number; background: string };
  layers: Layer[];
}

export type Layer =
  | RectLayer
  | ProductLayer
  | TextLayer
  | CtaButtonLayer
  | LogoLayer;

export interface RectLayer {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  rx?: number;
}

export interface ProductLayer {
  type: "product";
  x: number;
  y: number;
  w: number;
  h: number;
  shadow?: boolean;
}

export interface TextLayer {
  type: "text";
  key: "headline" | "subheadline" | "cta";
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontWeight?: "400" | "500" | "600" | "700";
  textAlign?: "left" | "center" | "right";
}

export interface CtaButtonLayer {
  type: "cta_btn";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  textFill: string;
  rx: number;
}

export interface LogoLayer {
  type: "logo";
  x: number;
  y: number;
  w: number;
  h: number;
}
