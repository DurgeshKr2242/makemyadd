// client/lib/templates/configs/urgency-red-9x16.ts
import type { TemplateConfig } from "@/lib/templates/types";

export const urgencyRed9x16: TemplateConfig = {
  id: "urgency_red_01_9x16",
  name: "Urgency Red — Story",
  format: "9x16",
  category: "urgency",
  canvas: { width: 1080, height: 1920, background: "#C81D25" },
  layers: [
    // Bold headline at top
    {
      type: "text",
      key: "headline",
      x: 60,
      y: 80,
      maxWidth: 960,
      fontSize: 96,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
    },
    // Product large in middle
    { type: "product", x: 100, y: 380, w: 880, h: 900, shadow: true },
    {
      type: "text",
      key: "subheadline",
      x: 60,
      y: 1380,
      maxWidth: 960,
      fontSize: 44,
      fontFamily: "Noto Sans",
      fill: "#fde2e4",
      fontWeight: "400",
    },
    // Full-width dark CTA at bottom
    {
      type: "cta_btn",
      x: 80,
      y: 1700,
      w: 920,
      h: 100,
      fill: "#111111",
      textFill: "#ffffff",
      rx: 16,
    },
    {
      type: "text",
      key: "cta",
      x: 540,
      y: 1750,
      maxWidth: 880,
      fontSize: 38,
      fontFamily: "Noto Sans",
      fill: "#ffffff",
      fontWeight: "700",
      textAlign: "center",
    },
  ],
};
