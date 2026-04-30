/**
 * Generate PWA + Apple touch icons from `public/icon.svg`.
 *
 * Run from client/: `node scripts/gen-icons.mjs`. Idempotent — safe to
 * re-run any time icon.svg changes. Output is committed to public/.
 */
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile("public/icon.svg", "utf8");
// sharp's SVG renderer doesn't support oklch() yet — substitute the visually
// equivalent hex values from globals.css (.dark block) for raster export.
const hexSvg = svg
  .replace(/oklch\(0\.085 0\.011 264\)/g, "#0a0a14")
  .replace(/oklch\(0\.78 0\.20 47\)/g, "#FF7A2E");

const buf = Buffer.from(hexSvg);

// Standard PWA icons
await sharp(buf, { density: 600 })
  .resize(192, 192)
  .png()
  .toFile("public/icon-192.png");
await sharp(buf, { density: 600 })
  .resize(512, 512)
  .png()
  .toFile("public/icon-512.png");

// Maskable icon needs a safe zone — wrap the icon at ~80% of canvas so it
// survives Android's circular / rounded mask without losing the sparkle.
const inner = await sharp(buf, { density: 600 })
  .resize(410, 410)
  .png()
  .toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 10, g: 10, b: 20, alpha: 1 },
  },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icon-maskable-512.png");

// Apple touch icon — 180×180 convention, no transparent bg
await sharp(buf, { density: 600 })
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");

console.log("Generated:");
for (const f of [
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
]) {
  console.log("  public/" + f);
}
