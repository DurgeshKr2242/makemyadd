/**
 * Mask compositing via sharp — TODO §7.1.
 *
 * Combines the RMBG-1.4 mask with the original image to produce a transparent
 * PNG. Stub for now — real implementation lands with §7.
 */
import "server-only";

export async function applyMaskToImage(
  _image: Buffer,
  _mask: Buffer,
): Promise<Buffer> {
  throw new Error("applyMaskToImage not implemented yet — see TODO §7.1");
}
