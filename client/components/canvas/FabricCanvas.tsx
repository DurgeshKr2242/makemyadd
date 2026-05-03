// client/components/canvas/FabricCanvas.tsx
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { FONT_FAMILIES } from "@/lib/fonts/families";
import { resolveColour } from "@/lib/templates/palettes";
import type {
  CtaButtonLayer,
  DividerLayer,
  GradientLayer,
  Layer,
  Palette,
  ProductLayer,
  RectLayer,
  ScrimLayer,
  TemplateConfig,
  TextLayer,
} from "@/lib/templates/types";
import type { Language } from "@/lib/types";

import { loadProxiedFont } from "./load-font";

export interface FabricCanvasProps {
  template: TemplateConfig;
  productImageUrl: string;
  copy: { headline: string; subheadline: string; cta: string };
  language: Language;
  /** Override the template's default palette (e.g. user-selected brand
   *  preset or a custom accent colour). */
  paletteOverride?: Palette;
  /** Replace the brand mark string (defaults to "AdCreator"). */
  brandName?: string;
  watermark?: boolean;
  /** CSS class on the wrapping div */
  className?: string;
  /** Visible canvas size — internal canvas is always template native res */
  displayWidth?: number;
}

export interface FabricCanvasHandle {
  /** Returns the canvas as a data URL (1080×1080 native), or null if the
   *  canvas isn't ready yet. */
  toDataUrl: () => string | null;
  /** Downloads the canvas as a PNG with the given filename (no extension).
   *  Returns true on success, false if the canvas wasn't ready. */
  download: (filename: string) => boolean;
}

export const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(
  function FabricCanvas(
    {
      template,
      productImageUrl,
      copy,
      language,
      paletteOverride,
      brandName,
      watermark = false,
      className,
      displayWidth = 480,
    }: FabricCanvasProps,
    ref,
  ) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<unknown>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      toDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        try {
          return canvas.toDataURL("image/png");
        } catch (err) {
          console.error("[FabricCanvas] toDataURL failed:", err);
          return null;
        }
      },
      download: (filename) => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        try {
          const url = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return true;
        } catch (err) {
          console.error("[FabricCanvas] download failed:", err);
          return false;
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;
      const family = FONT_FAMILIES[language];
      const palette = paletteOverride ?? template.palette;

      (async () => {
        try {
          const { fabric } = await import("fabric");
          if (cancelled || !canvasRef.current) return;

          await loadProxiedFont(family.slug, family.cssName);
          if (cancelled) return;

          // Dispose any previous canvas
          const fc = fabricRef.current as { dispose?: () => void } | null;
          fc?.dispose?.();

          const c = new fabric.Canvas(canvasRef.current, {
            width: template.canvas.width,
            height: template.canvas.height,
            selection: false,
            backgroundColor: resolveColour(template.canvas.background, palette),
            enableRetinaScaling: true,
          });
          fabricRef.current = c;

          // Fabric writes inline `width: 1080px; height: 1080px` styles on
          // both the <canvas> and the wrapping div fabric injects, which
          // overrides our `width: 100%`. Tell fabric to scale the CSS-only
          // dimensions to our display size while keeping the internal
          // resolution at template native (so exports stay 1080px crisp).
          const scale = displayWidth / template.canvas.width;
          c.setDimensions(
            {
              width: `${displayWidth}px`,
              height: `${template.canvas.height * scale}px`,
            },
            { cssOnly: true },
          );

          for (const layer of template.layers) {
            await renderLayer(
              fabric,
              c,
              layer,
              productImageUrl,
              copy,
              family.cssName,
              palette,
              brandName ?? "AdCreator",
            );
          }

          if (watermark) {
            // Watermark uses the language's Noto family (already loaded above)
            // so Devanagari / Tamil / Telugu canvases don't tofu the brand
            // mark when we localise it later.
            c.add(
              new fabric.Text("adcreator.in", {
                left: template.canvas.width - 24,
                top: template.canvas.height - 24,
                fontSize: 18,
                fill: "rgba(255,255,255,0.6)",
                fontFamily: `${family.cssName}, sans-serif`,
                originX: "right",
                originY: "bottom",
                selectable: false,
              }),
            );
          }

          c.renderAll();
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }
      })();

      return () => {
        cancelled = true;
        const fc = fabricRef.current as { dispose?: () => void } | null;
        fc?.dispose?.();
        fabricRef.current = null;
      };
    }, [
      template,
      productImageUrl,
      copy,
      language,
      paletteOverride,
      brandName,
      watermark,
      displayWidth,
    ]);

    return (
      <div
        ref={wrapperRef}
        className={className}
        style={{
          width: displayWidth,
          aspectRatio: `${template.canvas.width} / ${template.canvas.height}`,
          position: "relative",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", borderRadius: 12 }}
        />
        {error ? (
          <p className="absolute inset-0 flex items-center justify-center text-caption text-destructive p-4 text-center">
            Canvas error: {error}
          </p>
        ) : null}
      </div>
    );
  },
);

async function renderLayer(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: Layer,
  productImageUrl: string,
  copy: { headline: string; subheadline: string; cta: string },
  fontFamily: string,
  palette: Palette,
  brandName: string,
): Promise<void> {
  switch (layer.type) {
    case "rect":
      renderRect(fabric, canvas, layer, palette);
      return;
    case "gradient":
      renderGradient(fabric, canvas, layer, palette);
      return;
    case "scrim":
      renderScrim(fabric, canvas, layer, palette);
      return;
    case "divider":
      renderDivider(fabric, canvas, layer, palette);
      return;
    case "product":
      return renderProduct(fabric, canvas, layer, productImageUrl);
    case "text":
      renderText(fabric, canvas, layer, copy, fontFamily, palette, brandName);
      return;
    case "cta_btn":
      renderCtaBtn(fabric, canvas, layer, copy, palette);
      return;
    case "logo":
      // Brand kit lands with §14 Phase 2 — no-op for now.
      return;
    default: {
      const _exhaustive: never = layer;
      throw new Error(`Unhandled layer type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function renderRect(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: RectLayer,
  palette: Palette,
) {
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill: resolveColour(layer.fill, palette),
      rx: layer.rx,
      ry: layer.rx,
      selectable: false,
    }),
  );
}

function renderGradient(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: GradientLayer,
  palette: Palette,
) {
  const angle = layer.angle ?? 0;
  // Build the gradient direction from angle. 0° = top→bottom.
  const rad = (angle * Math.PI) / 180;
  const x2 = Math.sin(rad);
  const y2 = Math.cos(rad);
  const fill = new fabric.Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: layer.w * x2, y2: layer.h * y2 },
    colorStops: layer.stops.map((s) => ({
      offset: s.offset,
      color: resolveColour(s.color, palette),
    })),
  });
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill,
      rx: layer.rx,
      ry: layer.rx,
      selectable: false,
    }),
  );
}

function renderScrim(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: ScrimLayer,
  palette: Palette,
) {
  const colour = resolveColour(layer.colour ?? "#000000", palette);
  const alpha = layer.alpha ?? 0.7;
  const opaque = withAlpha(colour, alpha);
  const transparent = withAlpha(colour, 0);
  const stops =
    layer.from === "bottom"
      ? [
          { offset: 0, color: transparent },
          { offset: 1, color: opaque },
        ]
      : [
          { offset: 0, color: opaque },
          { offset: 1, color: transparent },
        ];
  const fill = new fabric.Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: 0, y2: layer.h },
    colorStops: stops,
  });
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill,
      selectable: false,
    }),
  );
}

function renderDivider(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: DividerLayer,
  palette: Palette,
) {
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.thickness ?? 1,
      fill: resolveColour(layer.fill, palette),
      selectable: false,
    }),
  );
}

async function renderProduct(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: ProductLayer,
  url: string,
) {
  await new Promise<void>((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) {
          reject(new Error("image load failed"));
          return;
        }
        const w = img.width ?? 1;
        const h = img.height ?? 1;
        const fit = layer.fit ?? "contain";
        const scale =
          fit === "cover"
            ? Math.max(layer.w / w, layer.h / h)
            : Math.min(layer.w / w, layer.h / h);
        const scaledW = w * scale;
        const scaledH = h * scale;
        const left =
          fit === "cover"
            ? layer.x + (layer.w - scaledW) / 2
            : layer.x + (layer.w - scaledW) / 2;
        const top =
          fit === "cover"
            ? layer.y + (layer.h - scaledH) / 2
            : layer.y + (layer.h - scaledH) / 2;

        // Clip path — rounded or circle mask, anchored in the layer's box.
        let clipPath: import("fabric").fabric.Object | undefined;
        if (layer.mask === "rounded") {
          const r = layer.cornerRadius ?? 24;
          clipPath = new fabric.Rect({
            left: layer.x,
            top: layer.y,
            width: layer.w,
            height: layer.h,
            rx: r,
            ry: r,
            absolutePositioned: true,
          });
        } else if (layer.mask === "circle") {
          const r = Math.min(layer.w, layer.h) / 2;
          clipPath = new fabric.Circle({
            left: layer.x + layer.w / 2 - r,
            top: layer.y + layer.h / 2 - r,
            radius: r,
            absolutePositioned: true,
          });
        }

        img.set({
          left,
          top,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          shadow: layer.shadow
            ? new fabric.Shadow({
                color: "rgba(0,0,0,0.45)",
                blur: 28,
                offsetY: 14,
              })
            : undefined,
          clipPath,
        });
        canvas.add(img);
        resolve();
      },
      { crossOrigin: "anonymous" },
    );
  });
}

function renderText(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: TextLayer,
  copy: { headline: string; subheadline: string; cta: string },
  fontFamily: string,
  palette: Palette,
  brandName: string,
) {
  const raw =
    layer.key === "brand"
      ? brandName || layer.staticText || "AdCreator"
      : copy[layer.key];
  if (!raw && layer.key !== "brand") return; // hide-when-empty for content

  const text = layer.uppercase ? raw.toUpperCase() : raw;
  const fontSize = layer.fontSize;
  const minFontSize = layer.minFontSize ?? Math.max(12, fontSize * 0.6);
  const lineHeight = layer.lineHeight ?? 1.16;

  // Build the textbox once at the starting font size, then auto-fit if
  // requested. Auto-fit shrinks the font size until the text's measured
  // height fits maxHeight (when set) — important for Indic scripts that
  // run wider than Latin and would otherwise overflow.
  const buildBox = (size: number) =>
    new fabric.Textbox(text, {
      left: layer.x,
      top: layer.y,
      width: layer.maxWidth,
      fontSize: size,
      fontFamily: `${fontFamily}, sans-serif`,
      fill: resolveColour(layer.fill, palette),
      fontWeight: layer.fontWeight ?? "500",
      textAlign: layer.textAlign ?? "left",
      lineHeight,
      charSpacing: (layer.letterSpacing ?? 0) * 50, // Fabric uses 1/1000 em
      selectable: false,
      splitByGrapheme: true,
    });

  let box = buildBox(fontSize);

  if (layer.fitMode === "shrink" && layer.maxHeight) {
    let size = fontSize;
    // Defensive cap of 32 iterations; in practice 6–10 are enough.
    for (let i = 0; i < 32; i++) {
      const measured = box.height ?? 0;
      if (measured <= layer.maxHeight || size <= minFontSize) break;
      size = Math.max(minFontSize, size - 2);
      box = buildBox(size);
    }
  }

  canvas.add(box);
}

function renderCtaBtn(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: CtaButtonLayer,
  copy: { headline: string; subheadline: string; cta: string },
  palette: Palette,
) {
  const hideWhenEmpty = layer.hideWhenEmpty ?? true;
  const paired = layer.pairedWith ?? "cta";
  if (
    hideWhenEmpty &&
    paired !== "brand" &&
    !copy[paired as "cta" | "headline" | "subheadline"]
  ) {
    return; // copy field empty — drop the button background entirely
  }
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill: resolveColour(layer.fill, palette),
      rx: layer.rx,
      ry: layer.rx,
      selectable: false,
    }),
  );
}

/** Apply alpha to a hex (#rrggbb / #rgb) or pass-through other strings. */
function withAlpha(colour: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  if (!colour.startsWith("#")) {
    // rgba() / named colour — wrap in a CSS rgba via a reasonable fallback.
    return colour.replace(/[\d.]+\)$/, `${a})`).startsWith("rgba")
      ? colour.replace(/[\d.]+\)$/, `${a})`)
      : colour;
  }
  const hex = colour.slice(1);
  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (expanded.length !== 6) return colour;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
