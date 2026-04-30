// client/lib/templates/configs/festival-bright-4x5.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const festivalBright4x5: TemplateConfig = {
  id: "festival_bright_01_4x5",
  name: "Festival Bright — Portrait",
  format: "4x5",
  category: "sale",
  canvas: { width: 1080, height: 1350, background: "#FF6B35" },
  layers: [
    // Product on the top half
    { type: "product", x: 80, y: 80, w: 920, h: 720, shadow: true },
    // Dark band below product
    { type: "rect", x: 0, y: 820, w: 1080, h: 530, fill: "#111111" },
    {
      type: "text",
      key: "headline",
      x: 60,
      y: 860,
      maxWidth: 960,
      fontSize: 72,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
    },
    {
      type: "text",
      key: "subheadline",
      x: 60,
      y: 1010,
      maxWidth: 960,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "#f5e9d8",
      fontWeight: "400",
    },
    {
      type: "cta_btn",
      x: 80,
      y: 1200,
      w: 920,
      h: 96,
      fill: "#ffffff",
      textFill: "#111111",
      rx: 16,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1248,
      maxWidth: 880,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "#111111",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
