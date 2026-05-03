/**
 * Editorial — magazine-cadence layout: ink on paper, decisive hairlines,
 * rounded product crop on one side, headline + serif accent on the other.
 * The "premium" template — works for fashion, beauty, electronics,
 * artisanal food, home goods.
 *
 * Pairs with PALETTES.indigo / .marigold / .monoLight by default; works
 * with any custom accent because the layout doesn't depend on the
 * accent being warm.
 */

import { PALETTES } from "@/lib/templates/palettes";
import type { TemplateConfig } from "@/lib/templates/types";

const palette = PALETTES.monoLight;

/** ── 1 × 1 — square (1080 × 1080) ─────────────────────────────────── */
export const editorial1x1: TemplateConfig = {
  id: "editorial_1x1",
  name: "Editorial",
  description:
    "Magazine-style split — rounded product on the right, headline and brand line on the left. Ink-on-paper premium.",
  format: "1x1",
  category: "showcase",
  tags: ["editorial", "minimal", "magazine"],
  palette,
  canvas: { width: 1080, height: 1080, background: "@paper" },
  layers: [
    // Paper background already, but add a soft surface "card" behind
    // the product for an offset look.
    {
      type: "rect",
      x: 540,
      y: 0,
      w: 540,
      h: 1080,
      fill: "@surface",
      rx: 0,
    },
    // Hairline rule under brand line.
    { type: "divider", x: 64, y: 156, w: 380, fill: "@ink", thickness: 1 },
    // Brand line — top-left, all-caps, tight tracking, ink colour.
    {
      type: "text",
      key: "brand",
      x: 64,
      y: 100,
      maxWidth: 380,
      fontSize: 22,
      fontFamily: "Noto Sans",
      fill: "@ink",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 3.6,
      staticText: "AdCreator",
    },
    // Eyebrow / mute label above headline.
    {
      type: "text",
      key: "subheadline",
      x: 64,
      y: 220,
      maxWidth: 420,
      maxHeight: 56,
      fontSize: 22,
      minFontSize: 16,
      fontFamily: "Noto Sans",
      fill: "@mute",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 2.4,
      fitMode: "shrink",
    },
    // Headline — large, ink, sets the editorial gravitas.
    {
      type: "text",
      key: "headline",
      x: 64,
      y: 320,
      maxWidth: 480,
      maxHeight: 480,
      fontSize: 80,
      minFontSize: 44,
      fontFamily: "Noto Sans",
      fill: "@ink",
      fontWeight: "500",
      fitMode: "shrink",
      lineHeight: 1.06,
      letterSpacing: -1.6,
    },
    // CTA pill — bottom-left, accent fill, hides when CTA copy missing.
    {
      type: "cta_btn",
      x: 64,
      y: 904,
      w: 360,
      h: 76,
      fill: "@accent",
      rx: 999,
      pairedWith: "cta",
      hideWhenEmpty: true,
    },
    {
      type: "text",
      key: "cta",
      x: 64,
      y: 932,
      maxWidth: 360,
      fontSize: 22,
      fontFamily: "Noto Sans",
      fill: "@accentInk",
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.4,
    },
    // Product — right column, rounded mask, drop shadow for lift.
    {
      type: "product",
      x: 580,
      y: 80,
      w: 460,
      h: 920,
      fit: "cover",
      mask: "rounded",
      cornerRadius: 28,
      shadow: true,
    },
    // Tiny accent dot in bottom-right of paper column — micro-detail.
    { type: "rect", x: 64, y: 1020, w: 8, h: 8, fill: "@accent", rx: 4 },
    {
      type: "text",
      key: "subheadline",
      x: 84,
      y: 1010,
      maxWidth: 440,
      fontSize: 14,
      fontFamily: "Noto Sans",
      fill: "@mute",
      fontWeight: "400",
      uppercase: true,
      letterSpacing: 2.2,
    },
  ],
};

/** ── 9 × 16 — vertical (1080 × 1920) ──────────────────────────────── */
export const editorial9x16: TemplateConfig = {
  ...editorial1x1,
  id: "editorial_9x16",
  format: "9x16",
  canvas: { width: 1080, height: 1920, background: "@paper" },
  layers: [
    // Top half: product. Bottom half: paper with copy.
    {
      type: "product",
      x: 0,
      y: 0,
      w: 1080,
      h: 1080,
      fit: "cover",
      mask: "none",
      shadow: false,
    },
    // Soft fade where product meets paper.
    {
      type: "scrim",
      x: 0,
      y: 940,
      w: 1080,
      h: 220,
      from: "bottom",
      alpha: 0.4,
      colour: "@paper",
    },
    // Brand line — over photo, top-left.
    {
      type: "text",
      key: "brand",
      x: 64,
      y: 88,
      maxWidth: 800,
      fontSize: 24,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 3.2,
      staticText: "AdCreator",
    },
    { type: "rect", x: 996, y: 102, w: 12, h: 12, fill: "@accent", rx: 6 },
    // Hairline above headline on paper section.
    { type: "divider", x: 64, y: 1180, w: 240, fill: "@ink", thickness: 1 },
    // Eyebrow.
    {
      type: "text",
      key: "subheadline",
      x: 64,
      y: 1212,
      maxWidth: 540,
      maxHeight: 56,
      fontSize: 24,
      minFontSize: 18,
      fontFamily: "Noto Sans",
      fill: "@mute",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 2.4,
      fitMode: "shrink",
    },
    // Big headline.
    {
      type: "text",
      key: "headline",
      x: 64,
      y: 1300,
      maxWidth: 952,
      maxHeight: 380,
      fontSize: 104,
      minFontSize: 56,
      fontFamily: "Noto Sans",
      fill: "@ink",
      fontWeight: "500",
      fitMode: "shrink",
      lineHeight: 1.04,
      letterSpacing: -1.8,
    },
    // CTA pill bottom-left.
    {
      type: "cta_btn",
      x: 64,
      y: 1740,
      w: 420,
      h: 88,
      fill: "@accent",
      rx: 999,
      pairedWith: "cta",
      hideWhenEmpty: true,
    },
    {
      type: "text",
      key: "cta",
      x: 64,
      y: 1772,
      maxWidth: 420,
      fontSize: 26,
      fontFamily: "Noto Sans",
      fill: "@accentInk",
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.4,
    },
  ],
};

/** ── 4 × 5 — portrait (1080 × 1350) ───────────────────────────────── */
export const editorial4x5: TemplateConfig = {
  ...editorial1x1,
  id: "editorial_4x5",
  format: "4x5",
  canvas: { width: 1080, height: 1350, background: "@paper" },
  layers: [
    // Top photo, bottom paper — 60/40 split.
    {
      type: "product",
      x: 0,
      y: 0,
      w: 1080,
      h: 800,
      fit: "cover",
      mask: "none",
    },
    {
      type: "rect",
      x: 0,
      y: 800,
      w: 1080,
      h: 550,
      fill: "@paper",
      rx: 0,
    },
    // Brand mark over photo.
    {
      type: "text",
      key: "brand",
      x: 64,
      y: 72,
      maxWidth: 800,
      fontSize: 22,
      fontFamily: "Noto Sans",
      fill: "#FFFFFF",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 3,
      staticText: "AdCreator",
    },
    { type: "rect", x: 996, y: 84, w: 12, h: 12, fill: "@accent", rx: 6 },
    // Hairline + eyebrow inside paper section.
    { type: "divider", x: 64, y: 880, w: 200, fill: "@ink", thickness: 1 },
    {
      type: "text",
      key: "subheadline",
      x: 64,
      y: 906,
      maxWidth: 540,
      maxHeight: 48,
      fontSize: 20,
      minFontSize: 16,
      fontFamily: "Noto Sans",
      fill: "@mute",
      fontWeight: "500",
      uppercase: true,
      letterSpacing: 2.4,
      fitMode: "shrink",
    },
    // Headline.
    {
      type: "text",
      key: "headline",
      x: 64,
      y: 970,
      maxWidth: 720,
      maxHeight: 220,
      fontSize: 76,
      minFontSize: 44,
      fontFamily: "Noto Sans",
      fill: "@ink",
      fontWeight: "500",
      fitMode: "shrink",
      lineHeight: 1.06,
      letterSpacing: -1.4,
    },
    // CTA pill bottom right.
    {
      type: "cta_btn",
      x: 760,
      y: 1224,
      w: 256,
      h: 76,
      fill: "@accent",
      rx: 999,
      pairedWith: "cta",
      hideWhenEmpty: true,
    },
    {
      type: "text",
      key: "cta",
      x: 760,
      y: 1252,
      maxWidth: 256,
      fontSize: 22,
      fontFamily: "Noto Sans",
      fill: "@accentInk",
      fontWeight: "600",
      textAlign: "center",
      letterSpacing: 0.4,
    },
  ],
};
