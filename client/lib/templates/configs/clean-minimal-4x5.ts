// client/lib/templates/configs/clean-minimal-4x5.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const cleanMinimal4x5: TemplateConfig = {
  id: "clean_minimal_01_4x5",
  name: "Clean Minimal — Portrait",
  format: "4x5",
  category: "showcase",
  canvas: { width: 1080, height: 1350, background: "#0F0F12" },
  layers: [
    // Product on top half, centered
    { type: "product", x: 80, y: 80, w: 920, h: 720 },
    // Subtle divider
    { type: "rect", x: 240, y: 840, w: 600, h: 2, fill: "#a1a1aa" },
    {
      type: "text",
      key: "headline",
      x: 80,
      y: 880,
      maxWidth: 920,
      fontSize: 60,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "500",
      textAlign: "center",
    },
    {
      type: "text",
      key: "subheadline",
      x: 80,
      y: 1000,
      maxWidth: 920,
      fontSize: 28,
      fontFamily: "Noto Sans",
      fill: "#a1a1aa",
      fontWeight: "400",
      textAlign: "center",
    },
    {
      type: "cta_btn",
      x: 220,
      y: 1180,
      w: 640,
      h: 90,
      fill: "#ffffff",
      textFill: "#0F0F12",
      rx: 999,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1225,
      maxWidth: 600,
      fontSize: 28,
      fontFamily: "Noto Sans",
      fill: "#0F0F12",
      fontWeight: "500",
      textAlign: "center",
    },
  ],
};
