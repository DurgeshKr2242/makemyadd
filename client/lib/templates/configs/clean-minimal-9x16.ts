// client/lib/templates/configs/clean-minimal-9x16.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const cleanMinimal9x16: TemplateConfig = {
  id: "clean_minimal_01_9x16",
  name: "Clean Minimal — Story",
  format: "9x16",
  category: "showcase",
  canvas: { width: 1080, height: 1920, background: "#0F0F12" },
  layers: [
    // Subtle top accent rule
    { type: "rect", x: 240, y: 60, w: 600, h: 4, fill: "#ffffff" },
    {
      type: "text",
      key: "headline",
      x: 80,
      y: 120,
      maxWidth: 920,
      fontSize: 84,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "500",
      textAlign: "center",
    },
    // Product large in the middle
    { type: "product", x: 100, y: 400, w: 880, h: 900 },
    {
      type: "text",
      key: "subheadline",
      x: 80,
      y: 1380,
      maxWidth: 920,
      fontSize: 36,
      fontFamily: "Noto Sans",
      fill: "#a1a1aa",
      fontWeight: "400",
      textAlign: "center",
    },
    {
      type: "cta_btn",
      x: 200,
      y: 1700,
      w: 680,
      h: 100,
      fill: "#ffffff",
      textFill: "#0F0F12",
      rx: 999,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1750,
      maxWidth: 640,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "#0F0F12",
      fontWeight: "500",
      textAlign: "center",
    },
  ],
};
