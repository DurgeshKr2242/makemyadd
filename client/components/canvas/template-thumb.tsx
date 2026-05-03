/**
 * Pure-SVG thumbnails for the template families. No Fabric mount, no
 * font load — these render instantly and stay crisp at any size, which
 * matters because they live in a hover-able selector.
 *
 * Each thumbnail captures the design DNA: photo region, scrim/divider,
 * headline mass, accent chip. The actual canvas does the live render.
 */
import type { Format } from "@/lib/types";

interface ThumbProps {
  family: "spotlight" | "editorial";
  format: Format;
  paletteAccent: string;
  paletteAccentInk: string;
  palettePaper: string;
  paletteInk: string;
}

const ASPECT: Record<Format, { w: number; h: number }> = {
  "1x1": { w: 100, h: 100 },
  "9x16": { w: 90, h: 160 },
  "4x5": { w: 100, h: 125 },
};

export function TemplateThumb({
  family,
  format,
  paletteAccent,
  paletteAccentInk,
  palettePaper,
  paletteInk,
}: ThumbProps) {
  const dim = ASPECT[format];

  if (family === "spotlight") {
    // Photo block + bottom scrim + headline mass + accent pill
    const photoH = dim.h;
    const headlineY = dim.h - 28;
    const scrimY = dim.h * 0.5;
    return (
      <svg
        viewBox={`0 0 ${dim.w} ${dim.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-full"
        aria-hidden
      >
        <title>Spotlight thumbnail</title>
        <defs>
          <linearGradient id={`scrim-${format}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`photo-${format}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a3a3a" />
            <stop offset="1" stopColor="#1a1a1a" />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={0}
          width={dim.w}
          height={photoH}
          fill={`url(#photo-${format})`}
        />
        <rect
          x={0}
          y={scrimY}
          width={dim.w}
          height={photoH - scrimY}
          fill={`url(#scrim-${format})`}
        />
        {/* Brand dot */}
        <circle cx={dim.w - 8} cy={8} r={1.6} fill={paletteAccent} />
        {/* Brand mark line */}
        <rect x={6} y={6} width={20} height={1.2} fill="#fff" rx={0.6} />
        {/* Headline mass */}
        <rect
          x={6}
          y={headlineY - 10}
          width={dim.w - 36}
          height={4}
          fill="#fff"
          rx={1}
        />
        <rect
          x={6}
          y={headlineY - 4}
          width={dim.w * 0.55}
          height={4}
          fill="#fff"
          rx={1}
        />
        {/* CTA pill */}
        <rect
          x={dim.w - 30}
          y={headlineY - 6}
          width={24}
          height={8}
          fill={paletteAccent}
          rx={4}
        />
      </svg>
    );
  }

  // Editorial — split: paper col with hairline, headline mass; surface col with rounded photo
  if (format === "1x1") {
    return (
      <svg
        viewBox={`0 0 ${dim.w} ${dim.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-full"
        aria-hidden
      >
        <title>Editorial thumbnail</title>
        <rect x={0} y={0} width={dim.w} height={dim.h} fill={palettePaper} />
        {/* Right column surface */}
        <rect
          x={dim.w / 2}
          y={0}
          width={dim.w / 2}
          height={dim.h}
          fill={paletteAccent}
          fillOpacity={0.06}
        />
        {/* Brand line + hairline */}
        <rect x={6} y={10} width={20} height={1.2} fill={paletteInk} />
        <rect
          x={6}
          y={15}
          width={36}
          height={0.6}
          fill={paletteInk}
          fillOpacity={0.6}
        />
        {/* Eyebrow */}
        <rect
          x={6}
          y={22}
          width={28}
          height={1}
          fill={paletteInk}
          fillOpacity={0.4}
        />
        {/* Headline mass */}
        <rect x={6} y={32} width={40} height={4} fill={paletteInk} rx={1} />
        <rect x={6} y={38} width={32} height={4} fill={paletteInk} rx={1} />
        <rect x={6} y={44} width={36} height={4} fill={paletteInk} rx={1} />
        {/* CTA pill */}
        <rect
          x={6}
          y={dim.h - 14}
          width={28}
          height={8}
          fill={paletteAccent}
          rx={4}
        />
        {/* Product card with rounded mask */}
        <rect
          x={dim.w / 2 + 4}
          y={6}
          width={dim.w / 2 - 8}
          height={dim.h - 12}
          fill="#666"
          rx={6}
        />
      </svg>
    );
  }
  // 9x16 / 4x5 editorial — photo top, paper bottom
  const photoH = format === "9x16" ? dim.h * 0.56 : dim.h * 0.55;
  return (
    <svg
      viewBox={`0 0 ${dim.w} ${dim.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-full"
      aria-hidden
    >
      <title>Editorial thumbnail</title>
      <rect x={0} y={0} width={dim.w} height={dim.h} fill={palettePaper} />
      <defs>
        <linearGradient id={`ed-photo-${format}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#666" />
          <stop offset="1" stopColor="#3a3a3a" />
        </linearGradient>
      </defs>
      <rect
        x={0}
        y={0}
        width={dim.w}
        height={photoH}
        fill={`url(#ed-photo-${format})`}
      />
      <rect x={6} y={6} width={20} height={1.2} fill="#fff" />
      <circle cx={dim.w - 8} cy={8} r={1.6} fill={paletteAccent} />
      {/* hairline + eyebrow + headline */}
      <rect x={6} y={photoH + 8} width={20} height={0.8} fill={paletteInk} />
      <rect
        x={6}
        y={photoH + 14}
        width={28}
        height={1.2}
        fill={paletteInk}
        fillOpacity={0.5}
      />
      <rect
        x={6}
        y={photoH + 24}
        width={dim.w - 12}
        height={4}
        fill={paletteInk}
        rx={1}
      />
      <rect
        x={6}
        y={photoH + 30}
        width={dim.w * 0.6}
        height={4}
        fill={paletteInk}
        rx={1}
      />
      <rect
        x={dim.w - 30}
        y={dim.h - 14}
        width={24}
        height={8}
        fill={paletteAccent}
        rx={4}
      />
      <rect
        x={6}
        y={dim.h - 14}
        width={2}
        height={2}
        fill={paletteAccentInk}
        opacity={0}
      />
    </svg>
  );
}
