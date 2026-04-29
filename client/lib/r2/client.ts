/**
 * Cloudflare R2 client — TODO §4 / §5.
 *
 * Stub. The S3-compatible client is constructed lazily so we don't pay the
 * AWS SDK import cost on routes that don't touch R2.
 */
import "server-only";

import { requireServerEnv, serverEnv } from "@/lib/env.server";

let cachedClient: unknown = null;

export async function getR2Client() {
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

export const R2_BUCKETS = {
  uploads: serverEnv.R2_BUCKET_UPLOADS,
  processed: serverEnv.R2_BUCKET_PROCESSED,
  public: serverEnv.R2_BUCKET_PUBLIC,
} as const;

export type R2Bucket = keyof typeof R2_BUCKETS;
