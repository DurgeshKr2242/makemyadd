/**
 * Rewrites every `https://fonts.gstatic.com/<path>` URL in a Google Fonts
 * CSS payload to `<base>/<encodeURIComponent(path)>` so the browser fetches
 * the .woff2 from our domain (avoids CORS taint on the Fabric canvas — see
 * spec §11).
 */
const GSTATIC_URL = /url\(\s*https:\/\/fonts\.gstatic\.com\/([^)]+?)\s*\)/g;

export function rewriteFontCss(css: string, base: string): string {
  return css.replace(GSTATIC_URL, (_match, path: string) => {
    return `url(${base}/${encodeURIComponent(path)})`;
  });
}
