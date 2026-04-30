import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "AdCreator — AI ads for Indian small businesses, in 30 seconds.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Geist Sans for the headline. Fetch the woff2 from gstatic (the OG
  // image renderer runs at request time on the edge, so we can hit the
  // public CDN; CORS is irrelevant for server-side fetch).
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
        justifyContent: "space-between",
        padding: 80,
        background: "#0a0a14",
        color: "#fafafa",
        fontFamily: "Geist",
      }}
    >
      {/* Top: brand mark + tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "#FF7A2E",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 600,
            color: "#1a0e02",
          }}
        >
          ★
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: -0.5 }}>
          AdCreator
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 18,
            color: "#a1a1aa",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          Made in India
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: -2.5,
            lineHeight: 1.05,
            maxWidth: 920,
          }}
        >
          Studio-quality ads in your language,
          <br />
          in 30 seconds.
        </div>
        <div style={{ fontSize: 26, color: "#a1a1aa", maxWidth: 820 }}>
          English · हिन्दी · தமிழ் · తెలుగు
        </div>
      </div>

      {/* Bottom: domain pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            fontSize: 22,
            color: "#FF7A2E",
            border: "1px solid rgba(255, 122, 46, 0.35)",
            borderRadius: 999,
            padding: "8px 18px",
          }}
        >
          adcreator.in
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Geist", data: geist, style: "normal", weight: 500 }],
    },
  );
}
