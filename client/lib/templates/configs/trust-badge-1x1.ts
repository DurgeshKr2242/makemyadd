// client/lib/templates/configs/trust-badge-1x1.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const trustBadge1x1: TemplateConfig = {
  id: "trust_badge_01_1x1",
  name: "Trust Badge",
  format: "1x1",
  category: "trust",
  canvas: { width: 1080, height: 1080, background: "#1B2A4E" },
  layers: [
    // Decorative corner accent — top-left trust seal motif
    { type: "rect", x: 0, y: 0, w: 160, h: 160, fill: "#ffffff", rx: 0 },
    { type: "rect", x: 20, y: 20, w: 120, h: 120, fill: "#1B2A4E", rx: 0 },
    { type: "rect", x: 40, y: 40, w: 80, h: 80, fill: "#ffffff", rx: 4 },
    // Product centered with shadow for trust feel
    { type: "product", x: 190, y: 80, w: 700, h: 620, shadow: true },
    {
      type: "text",
      key: "headline",
      x: 80,
      y: 760,
      maxWidth: 920,
      fontSize: 60,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "600",
      textAlign: "center",
    },
    {
      type: "text",
      key: "subheadline",
      x: 80,
      y: 870,
      maxWidth: 920,
      fontSize: 28,
      fontFamily: "Noto Sans",
      fill: "#a8b8d8",
      fontWeight: "400",
      textAlign: "center",
    },
    // "Verified" CTA button in success green
    {
      type: "cta_btn",
      x: 280,
      y: 960,
      w: 520,
      h: 80,
      fill: "#22c55e",
      textFill: "#ffffff",
      rx: 12,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1000,
      maxWidth: 480,
      fontSize: 26,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
