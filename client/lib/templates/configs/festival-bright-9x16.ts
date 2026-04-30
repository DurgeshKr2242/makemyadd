// client/lib/templates/configs/festival-bright-9x16.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const festivalBright9x16: TemplateConfig = {
  id: "festival_bright_01_9x16",
  name: "Festival Bright — Story",
  format: "9x16",
  category: "sale",
  canvas: { width: 1080, height: 1920, background: "#FF6B35" },
  layers: [
    // Dark stripe behind headline for contrast
    { type: "rect", x: 0, y: 0, w: 1080, h: 320, fill: "#111111" },
    {
      type: "text",
      key: "headline",
      x: 60,
      y: 80,
      maxWidth: 960,
      fontSize: 80,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
    },
    // Product prominent in the center
    { type: "product", x: 100, y: 380, w: 880, h: 900, shadow: true },
    {
      type: "text",
      key: "subheadline",
      x: 60,
      y: 1340,
      maxWidth: 960,
      fontSize: 40,
      fontFamily: "Noto Sans",
      fill: "#f5e9d8",
      fontWeight: "400",
    },
    // Full-width CTA at bottom
    { type: "rect", x: 0, y: 1760, w: 1080, h: 160, fill: "#111111" },
    {
      type: "cta_btn",
      x: 80,
      y: 1790,
      w: 920,
      h: 100,
      fill: "#ffffff",
      textFill: "#111111",
      rx: 16,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1840,
      maxWidth: 880,
      fontSize: 36,
      fontFamily: "Noto Sans",
      fill: "#111111",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
