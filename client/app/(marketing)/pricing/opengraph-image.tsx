import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AdCreator pricing — plans from ₹0 to ₹2,999 / month.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIERS = [
  { label: "Free", price: "₹0" },
  { label: "Starter", price: "₹499" },
  { label: "Pro", price: "₹1,199" },
  { label: "Agency", price: "₹2,999" },
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
        AdCreator · Pricing
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 500,
          letterSpacing: -2,
          marginBottom: 56,
        }}
      >
        Plans that <span style={{ color: "#FF7A2E" }}>grow</span> with you.
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {TIERS.map((t) => (
          <div
            key={t.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "#15151c",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "24px 28px",
              minWidth: 220,
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: "#a1a1aa",
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {t.label}
            </div>
            <div style={{ fontSize: 42, fontWeight: 500 }}>{t.price}</div>
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
