// client/lib/templates/configs/urgency-red-4x5.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const urgencyRed4x5: TemplateConfig = {
  id: "urgency_red_01_4x5",
  name: "Urgency Red — Portrait",
  format: "4x5",
  category: "urgency",
  canvas: { width: 1080, height: 1350, background: "#C81D25" },
  layers: [
    // Product on top half
    { type: "product", x: 80, y: 80, w: 920, h: 720, shadow: true },
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
      y: 1000,
      maxWidth: 960,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "#fde2e4",
      fontWeight: "400",
    },
    {
      type: "cta_btn",
      x: 80,
      y: 1180,
      w: 920,
      h: 96,
      fill: "#111111",
      textFill: "#ffffff",
      rx: 16,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1228,
      maxWidth: 880,
      fontSize: 32,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
