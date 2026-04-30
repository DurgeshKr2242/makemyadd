import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "AdCreator templates — 10 designs across 3 formats, all 4 languages.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SWATCHES = [
  { name: "Festival", color: "#FF6B35" },
  { name: "Clean", color: "#0F0F12" },
  { name: "Urgency", color: "#C81D25" },
  { name: "Trust", color: "#1B2A4E" },
];

export default async function Image() {
  const geist = await fetch(
    "https://fonts.gstatic.com/s/geist/v3/gyByhwUxId8gMEwYGFU2cs0_a.woff2",
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#0a0a14",
        color: "#fafafa",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          fontSize: 22,
          color: "#a1a1aa",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        AdCreator · Templates
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 500,
          letterSpacing: -2,
          marginBottom: 48,
          maxWidth: 920,
        }}
      >
        Designs that <span style={{ color: "#FF7A2E" }}>actually</span> fit.
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {SWATCHES.map((s) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              flexDirection: "column",
              width: 200,
              height: 200,
              borderRadius: 18,
              background: s.color,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 18,
              justifyContent: "flex-end",
              color: "#fafafa",
              fontSize: 16,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {s.name}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Geist", data: geist, style: "normal", weight: 500 }],
    },
  );
}
