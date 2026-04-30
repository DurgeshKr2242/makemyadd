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
          c.add(
            new fabric.Text("adcreator.in", {
              left: template.canvas.width - 24,
              top: template.canvas.height - 24,
              fontSize: 18,
              fill: "rgba(255,255,255,0.6)",
              fontFamily: "sans-serif",
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
  }, [template, productImageUrl, copy, language, watermark]);

  const aspect = template.canvas.height / template.canvas.width;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: displayWidth,
        aspectRatio: `${template.canvas.width} / ${template.canvas.height}`,
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          borderRadius: 12,
        }}
      />
      {error ? (
        <p className="absolute inset-0 flex items-center justify-center text-caption text-destructive p-4 text-center">
          Canvas error: {error}
        </p>
      ) : null}
      {/* Avoid unused-var lint on aspect (used implicitly via aspectRatio) */}
      <span className="sr-only">{aspect.toFixed(2)}</span>
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
  if (layer.type === "rect") return renderRect(fabric, canvas, layer);
  if (layer.type === "product")
    return renderProduct(fabric, canvas, layer, productImageUrl);
  if (layer.type === "text")
    return renderText(fabric, canvas, layer, copy, fontFamily);
  if (layer.type === "cta_btn") return renderCtaBtn(fabric, canvas, layer);
  if (layer.type === "logo") return; // logo support lands with §14 brand kit
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
