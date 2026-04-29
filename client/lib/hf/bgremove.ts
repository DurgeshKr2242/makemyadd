/**
 * HuggingFace background removal — TODO §7.
 *
 * Stub. Real implementation lands when `/api/generate/bgremove` is wired
 * (§7.1–7.4). Will use the direct HTTP API (SDK has had binary-response
 * issues), retry on 429/503, and combine the mask with the original image
 * via sharp before returning a transparent PNG.
 */
import "server-only";

export type BgRemoveResult = {
  buffer: Buffer;
  fromCache: boolean;
};

export async function removeBackground(
  _imageUrl: string,
): Promise<BgRemoveResult> {
  throw new Error("removeBackground not implemented yet — see TODO §7");
}
