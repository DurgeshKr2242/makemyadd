/**
 * Spotlight — full-bleed product photo with a bottom scrim and large
 * headline overlay. Apple-product-page cadence: photo does the talking,
 * type does the announcing, accent chip carries the CTA.
 *
 * Engineered to:
 *  - render at 1×1, 9×16, 4×5 from the same design DNA
 *  - auto-fit the headline (Indic scripts can run +25% wider — auto-shrink
 *    keeps the layout stable)
 *  - hide the CTA chip + subheadline when their copy fields are empty
 *    (real-world copy doesn't always have a CTA — we don't render a fake
 *    button)
 *  - take any palette, including a custom brand colour
 */

import { PALETTES } from "@/lib/templates/palettes";
import type { TemplateConfig } from "@/lib/templates/types";

const palette = PALETTES.saffron;

/** ── 1 × 1 — Instagram / Facebook feed post (1080 × 1080) ─────────── */
export const spotlight1x1: TemplateConfig = {
  id: "spotlight_1x1",
  name: "Spotlight",
  description:
    "Full-bleed photo with bottom scrim and an editorial headline. The product is the hero.",
  format: "1x1",
  category: "showcase",
  tags: ["photo-led", "bold", "editorial"],
  palette,
  canvas: { width: 1080, height: 1080, background: "@paper" },
  layers: [
    // Photo fills the square edge to edge.
    {
      type: "product",
      x: 0,
      y: 0,
      w: 1080,
      h: 1080,
      fit: "cover",
      mask: "none",
    },
    // Bottom scrim — black-to-transparent over the lower 60% so the
    // headline reads regardless of photo content.
    {
      type: "scrim",
      x: 0,
      y: 432,
      w: 1080,
      h: 648,
      from: "bottom",
      alpha: 0.78,
    },
    // Brand mark — top-left, small, all-caps, breathes against the photo.
    {
      type: "text",
      key: "brand",
      x: 64,
      y: 64,
      maxWidth: 800,
      fontSize: 24,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 3,
      staticText: "AdCreator",
    },
    // Accent dot + label — micro signal in top-right.
    { type: "rect", x: 1000, y: 76, w: 12, h: 12, fill: "@accent", rx: 6 },
    // Headline — large, weight 600, sits low.
    {
      type: "text",
      key: "headline",
      x: 64,
      y: 720,
      maxWidth: 952,
      maxHeight: 200,
      fontSize: 88,
      minFontSize: 52,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "600",
      fitMode: "shrink",
      lineHeight: 1.06,
      letterSpacing: -1.5,
    },
    // Subheadline — quieter, 70% white, beneath the headline.
    {
      type: "text",
      key: "subheadline",
      x: 64,
      y: 936,
      maxWidth: 720,
      maxHeight: 64,
      fontSize: 24,
      minFontSize: 18,
      fontFamily: "Noto Sans",
      fill: "rgba(255,255,255,0.78)",
      fontWeight: "400",
      fitMode: "shrink",
      lineHeight: 1.35,
    },
    // CTA chip — pill, accent fill, only renders when CTA copy is present.
    {
      type: "cta_btn",
      x: 800,
      y: 928,
      w: 232,
      h: 72,
      fill: "@accent",
      rx: 999,
      pairedWith: "cta",
      hideWhenEmpty: true,
    },
    {
      type: "text",
      key: "cta",
      x: 800,
      y: 952,
      maxWidth: 232,
      fontSize: 22,
      fontFamily: "Noto Sans",
      fill: "@accentInk",
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.4,
    },
  ],
};

/** ── 9 × 16 — Reels / Stories (1080 × 1920) ───────────────────────── */
export const spotlight9x16: TemplateConfig = {
  ...spotlight1x1,
  id: "spotlight_9x16",
  format: "9x16",
  canvas: { width: 1080, height: 1920, background: "@paper" },
  layers: [
    {
      type: "product",
      x: 0,
      y: 0,
      w: 1080,
      h: 1920,
      fit: "cover",
      mask: "none",
    },
    // Top scrim — protects brand mark.
    { type: "scrim", x: 0, y: 0, w: 1080, h: 320, from: "top", alpha: 0.55 },
    // Bottom scrim — heavier, runs ~half the canvas.
    {
      type: "scrim",
      x: 0,
      y: 960,
      w: 1080,
      h: 960,
      from: "bottom",
      alpha: 0.82,
    },
    {
      type: "text",
      key: "brand",
      x: 64,
      y: 88,
      maxWidth: 800,
      fontSize: 26,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 3,
      staticText: "AdCreator",
    },
    { type: "rect", x: 996, y: 102, w: 14, h: 14, fill: "@accent", rx: 7 },
    // Accent rule above headline.
    { type: "rect", x: 64, y: 1380, w: 80, h: 6, fill: "@accent", rx: 3 },
    {
      type: "text",
      key: "headline",
      x: 64,
      y: 1420,
      maxWidth: 952,
      maxHeight: 320,
      fontSize: 112,
      minFontSize: 64,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "600",
      fitMode: "shrink",
      lineHeight: 1.04,
      letterSpacing: -2,
    },
    {
      type: "text",
      key: "subheadline",
      x: 64,
      y: 1700,
      maxWidth: 760,
      maxHeight: 88,
      fontSize: 28,
      minFontSize: 20,
      fontFamily: "Noto Sans",
      fill: "rgba(255,255,255,0.78)",
      fontWeight: "400",
      fitMode: "shrink",
      lineHeight: 1.35,
    },
    {
      type: "cta_btn",
      x: 64,
      y: 1810,
      w: 952,
      h: 96,
      fill: "@accent",
      rx: 16,
      pairedWith: "cta",
      hideWhenEmpty: true,
    },
    {
      type: "text",
      key: "cta",
      x: 64,
      y: 1840,
      maxWidth: 952,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "@accentInk",
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.6,
    },
  ],
};

/** ── 4 × 5 — Portrait feed post (1080 × 1350) ─────────────────────── */
export const spotlight4x5: TemplateConfig = {
  ...spotlight1x1,
  id: "spotlight_4x5",
  format: "4x5",
  canvas: { width: 1080, height: 1350, background: "@paper" },
  layers: [
    {
      type: "product",
      x: 0,
      y: 0,
      w: 1080,
      h: 1350,
      fit: "cover",
      mask: "none",
    },
    { type: "scrim", x: 0, y: 0, w: 1080, h: 220, from: "top", alpha: 0.5 },
    {
      type: "scrim",
      x: 0,
      y: 580,
      w: 1080,
      h: 770,
      from: "bottom",
      alpha: 0.8,
    },
    {
      type: "text",
      key: "brand",
      x: 64,
      y: 72,
      maxWidth: 800,
      fontSize: 24,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 3,
      staticText: "AdCreator",
    },
    { type: "rect", x: 996, y: 84, w: 12, h: 12, fill: "@accent", rx: 6 },
    { type: "rect", x: 64, y: 920, w: 64, h: 5, fill: "@accent", rx: 2.5 },
    {
      type: "text",
      key: "headline",
      x: 64,
      y: 950,
      maxWidth: 952,
      maxHeight: 240,
      fontSize: 96,
      minFontSize: 56,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "600",
      fitMode: "shrink",
      lineHeight: 1.05,
      letterSpacing: -1.5,
    },
    {
      type: "text",
      key: "subheadline",
      x: 64,
      y: 1192,
      maxWidth: 720,
      maxHeight: 64,
      fontSize: 24,
      minFontSize: 18,
      fontFamily: "Noto Sans",
      fill: "rgba(255,255,255,0.78)",
      fontWeight: "400",
      fitMode: "shrink",
      lineHeight: 1.35,
    },
    {
      type: "cta_btn",
      x: 800,
      y: 1188,
      w: 232,
      h: 72,
      fill: "@accent",
      rx: 999,
      pairedWith: "cta",
      hideWhenEmpty: true,
    },
    {
      type: "text",
      key: "cta",
      x: 800,
      y: 1212,
      maxWidth: 232,
      fontSize: 22,
      fontFamily: "Noto Sans",
      fill: "@accentInk",
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.4,
    },
  ],
};
