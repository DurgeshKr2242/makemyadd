/**
 * Cloudflare R2 client — TODO §4 / §5.
 *
 * The S3-compatible client is constructed lazily so we don't pay the AWS
 * SDK import cost on routes that don't touch R2. Inert when env keys are
 * missing — `isR2Configured()` is the gate.
 */
import "server-only";

import { requireServerEnv, serverEnv } from "@/lib/env.server";

let cachedClient: unknown = null;

export const R2_BUCKETS = {
  uploads: serverEnv.R2_BUCKET_UPLOADS,
  processed: serverEnv.R2_BUCKET_PROCESSED,
  public: serverEnv.R2_BUCKET_PUBLIC,
} as const;

export type R2Bucket = keyof typeof R2_BUCKETS;

export function isR2Configured(): boolean {
  return Boolean(
    serverEnv.CLOUDFLARE_ACCOUNT_ID &&
      serverEnv.R2_ACCESS_KEY_ID &&
      serverEnv.R2_SECRET_ACCESS_KEY,
  );
}

async function getR2Client() {
  if (cachedClient) return cachedClient;
  const accountId = requireServerEnv("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = requireServerEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireServerEnv("R2_SECRET_ACCESS_KEY");
  const { S3Client } = await import("@aws-sdk/client-s3");
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient as InstanceType<typeof S3Client>;
}

/** Construct the public CDN URL for an object key. All three buckets are
 *  routed through R2_PUBLIC_BASE for the canvas-render pipeline; the
 *  upload bucket is private to the SDK but rehosted images live in
 *  `processed` and template assets live in `public`. */
export function publicUrl(key: string, _bucket: R2Bucket = "public"): string {
  const base = serverEnv.R2_PUBLIC_BASE ?? "https://assets.adcreator.in";
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export async function uploadToR2(
  body: Uint8Array | Buffer,
  key: string,
  contentType: string,
  bucket: R2Bucket = "uploads",
): Promise<{ key: string; publicUrl: string }> {
  const r2 = await getR2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKETS[bucket],
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, publicUrl: publicUrl(key, bucket) };
}

export async function presignPut(
  key: string,
  contentType: string,
  bucket: R2Bucket = "uploads",
  expiresIn = 300,
): Promise<string> {
  const r2 = await getR2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKETS[bucket],
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}
