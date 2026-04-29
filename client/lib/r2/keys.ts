/**
 * R2 key naming — TODO §4.4.
 *
 * One module owns the path conventions so we never trip over inconsistent
 * keys between the upload presign and the BG-removal upload.
 */

const SAFE_EXT = /^[a-z0-9]+$/;

export function uploadKey(userId: string, ext: string): string {
  const cleanExt = ext.toLowerCase();
  if (!SAFE_EXT.test(cleanExt)) {
    throw new Error(`Invalid file extension: ${ext}`);
  }
  return `uploads/${userId}/${crypto.randomUUID()}.${cleanExt}`;
}

export function processedKey(): string {
  return `processed/bgr-${crypto.randomUUID()}.png`;
}

export function exportKey(userId: string, generationId: string): string {
  return `exports/${userId}/${generationId}.png`;
}
