"use client";

/**
 * Loads a Google Font via the FontFace API by fetching our proxied CSS,
 * extracting the @font-face srcs in parallel, and registering them with
 * the document. Used by FabricCanvas to ensure the canvas's drawn text
 * uses Devanagari / Tamil / Telugu glyphs without tainting the canvas.
 *
 * Resolves once all faces are registered or rejects on network error.
 */
export async function loadProxiedFont(
  slug: string,
  family: string,
): Promise<void> {
  // Bail if already loaded — match by family AND any registered face.
  if (
    typeof document !== "undefined" &&
    document.fonts &&
    Array.from(document.fonts).some((f) => f.family === family)
  ) {
    return;
  }

  const cssRes = await fetch(`/api/fonts/${slug}`, { cache: "force-cache" });
  if (!cssRes.ok) throw new Error(`font css fetch failed: ${cssRes.status}`);
  const css = await cssRes.text();

  // Google Fonts CSS has one @font-face per weight + subset. Parse them all
  // and register each weight separately so Fabric's font-weight lookup
  // resolves correctly. Strip any quotes the rewriter wrapped the URL in
  // (the proxy emits double-quoted url("..."), which is valid CSS but
  // FontFace wants the bare URL).
  const blocks = css.split("@font-face").slice(1); // first split is preamble
  const faces = blocks
    .map((block) => {
      const rawUrl = block
        .match(/url\(([^)]+)\)/)?.[1]
        ?.replace(/^["']|["']$/g, "");
      const weight = block.match(/font-weight:\s*(\d+)/)?.[1] ?? "400";
      if (!rawUrl) return null;
      // Resolve to absolute URL — older Safari versions don't resolve
      // relative URLs in FontFace constructors against document.baseURI.
      const absoluteUrl = new URL(rawUrl, window.location.href).href;
      return new FontFace(family, `url(${absoluteUrl})`, {
        weight,
        display: "swap",
      });
    })
    .filter((face): face is FontFace => face !== null);

  // Load all weights in parallel — sequential awaits cost an extra round
  // trip per face on slow networks.
  await Promise.all(
    faces.map(async (face) => {
      await face.load();
      document.fonts.add(face);
    }),
  );
}
