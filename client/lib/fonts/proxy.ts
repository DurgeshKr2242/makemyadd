/**
 * Rewrites every `https://fonts.gstatic.com/<path>` URL in a Google Fonts
 * CSS payload to `<base>/<encodeURIComponent(path)>` so the browser fetches
 * the .woff2 from our domain (avoids CORS taint on the Fabric canvas — see
 * spec §11).
 *
 * Tolerates bare, single-quoted, and double-quoted url() forms — Google
 * currently emits bare but the CSS spec allows all three. Always emits a
 * double-quoted url() so any character in the path (parentheses included)
 * stays valid CSS without further escaping.
 */
const GSTATIC_URL =
  /url\(\s*(['"]?)https:\/\/fonts\.gstatic\.com\/([^'")]+?)\1\s*\)/g;

export function rewriteFontCss(css: string, base: string): string {
  return css.replace(GSTATIC_URL, (_match, _quote: string, path: string) => {
    return `url("${base}/${encodeURIComponent(path)}")`;
  });
}
