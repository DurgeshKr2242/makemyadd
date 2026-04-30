// client/components/canvas/FabricCanvas.tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { FONT_FAMILIES } from "@/lib/fonts/families";
import type {
  CtaButtonLayer,
  Layer,
  ProductLayer,
  RectLayer,
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
  watermark?: boolean;
  /** CSS class on the wrapping div */
  className?: string;
  /** Visible canvas size — internal canvas is always template native res */
  displayWidth?: number;
}

export function FabricCanvas({
  template,
  productImageUrl,
  copy,
  language,
  watermark = false,
  className,
  displayWidth = 480,
}: FabricCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const family = FONT_FAMILIES[language];

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
          backgroundColor: template.canvas.background,
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
  }, [template, productImageUrl, copy, language, watermark, displayWidth]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: displayWidth,
        aspectRatio: `${template.canvas.width} / ${template.canvas.height}`,
        position: "relative",
        // Fabric inserts a wrapper <div class="canvas-container"> around
        // the <canvas> with inline pixel dimensions matching the native
        // resolution. Constraining max-width on this outer wrapper plus
        // the cssOnly setDimensions call inside useEffect keeps everything
        // sized to displayWidth.
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", borderRadius: 12 }} />
      {error ? (
        <p className="absolute inset-0 flex items-center justify-center text-caption text-destructive p-4 text-center">
          Canvas error: {error}
        </p>
      ) : null}
    </div>
  );
}

async function renderLayer(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: Layer,
  productImageUrl: string,
  copy: { headline: string; subheadline: string; cta: string },
  fontFamily: string,
): Promise<void> {
  // Exhaustive switch — adding a new Layer type without a branch fails
  // at compile time on the `_exhaustive: never` line below.
  switch (layer.type) {
    case "rect":
      renderRect(fabric, canvas, layer);
      return;
    case "product":
      return renderProduct(fabric, canvas, layer, productImageUrl);
    case "text":
      renderText(fabric, canvas, layer, copy, fontFamily);
      return;
    case "cta_btn":
      renderCtaBtn(fabric, canvas, layer);
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
) {
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill: layer.fill,
      rx: layer.rx,
      ry: layer.rx,
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
        const scale = Math.min(layer.w / w, layer.h / h);
        img.set({
          left: layer.x + (layer.w - w * scale) / 2,
          top: layer.y + (layer.h - h * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          shadow: layer.shadow
            ? new fabric.Shadow({
                color: "rgba(0,0,0,0.45)",
                blur: 28,
                offsetY: 12,
              })
            : undefined,
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
) {
  const text = copy[layer.key];
  canvas.add(
    new fabric.Textbox(text, {
      left: layer.x,
      top: layer.y,
      width: layer.maxWidth,
      fontSize: layer.fontSize,
      fontFamily: `${fontFamily}, sans-serif`,
      fill: layer.fill,
      fontWeight: layer.fontWeight ?? "500",
      textAlign: layer.textAlign ?? "left",
      selectable: false,
      splitByGrapheme: true,
    }),
  );
}

function renderCtaBtn(
  fabric: typeof import("fabric").fabric,
  canvas: import("fabric").fabric.Canvas,
  layer: CtaButtonLayer,
) {
  canvas.add(
    new fabric.Rect({
      left: layer.x,
      top: layer.y,
      width: layer.w,
      height: layer.h,
      fill: layer.fill,
      rx: layer.rx,
      ry: layer.rx,
      selectable: false,
    }),
  );
}
