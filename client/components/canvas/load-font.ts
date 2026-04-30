"use client";

/**
 * Loads a Google Font via the FontFace API by fetching our proxied CSS,
 * extracting the first @font-face src, and registering it with the document.
 * Used by FabricCanvas to ensure the canvas's drawn text uses Devanagari /
 * Tamil / Telugu glyphs without tainting the canvas.
 *
 * Resolves once the font is ready or rejects on network error.
 */
export async function loadProxiedFont(
  slug: string,
  family: string,
): Promise<void> {
  // Bail if already loaded
  if (
    document.fonts &&
    Array.from(document.fonts).some((f) => f.family === family)
  ) {
    return;
  }

  const cssRes = await fetch(`/api/fonts/${slug}`, { cache: "force-cache" });
  if (!cssRes.ok) throw new Error(`font css fetch failed: ${cssRes.status}`);
  const css = await cssRes.text();

  // Pick the first .woff2 url and weight from the CSS payload
  const blocks = css.split("@font-face");
  for (const block of blocks) {
    const url = block.match(/url\(([^)]+)\)/)?.[1];
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    if (!url) continue;
    const weight = weightMatch?.[1] ?? "400";
    const face = new FontFace(family, `url(${url})`, {
      weight,
      display: "swap",
    });
    await face.load();
    document.fonts.add(face);
  }
}
