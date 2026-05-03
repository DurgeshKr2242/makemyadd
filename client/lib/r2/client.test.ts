import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const send = vi.fn();
class S3ClientMock {
  send = send;
  destroy() {}
}
class PutObjectCommandMock {
  constructor(public input: unknown) {}
}
class GetObjectCommandMock {
  constructor(public input: unknown) {}
}
const getSignedUrlMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: S3ClientMock,
  PutObjectCommand: PutObjectCommandMock,
  GetObjectCommand: GetObjectCommandMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    CLOUDFLARE_ACCOUNT_ID: "acct123",
    R2_ACCESS_KEY_ID: "ak",
    R2_SECRET_ACCESS_KEY: "sk",
    R2_PUBLIC_BASE: "https://assets.adcreator.in",
    R2_BUCKET_UPLOADS: "adcreator-uploads",
    R2_BUCKET_PROCESSED: "adcreator-processed",
    R2_BUCKET_PUBLIC: "adcreator-public",
  },
  requireServerEnv: (k: string) =>
    ({
      CLOUDFLARE_ACCOUNT_ID: "acct123",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
    })[k as string]!,
}));

beforeEach(() => {
  send.mockReset();
  getSignedUrlMock.mockReset();
});
afterEach(() => vi.restoreAllMocks());

import { isR2Configured, presignPut, publicUrl, uploadToR2 } from "./client";

describe("isR2Configured", () => {
  it("returns true when all required env vars are present", () => {
    expect(isR2Configured()).toBe(true);
  });
});

describe("publicUrl", () => {
  it("constructs a public URL using R2_PUBLIC_BASE for the public bucket", () => {
    expect(publicUrl("templates/festival.png", "public")).toBe(
      "https://assets.adcreator.in/templates/festival.png",
    );
  });
  it("constructs a processed-bucket URL via the same public base", () => {
    expect(publicUrl("processed/bgr-x.png", "processed")).toBe(
      "https://assets.adcreator.in/processed/bgr-x.png",
    );
  });
});

describe("uploadToR2", () => {
  it("calls S3 PutObject with the right bucket + key", async () => {
    send.mockResolvedValue({});
    const buf = new Uint8Array([1, 2, 3]);
    const r = await uploadToR2(
      buf,
      "uploads/u1/file.png",
      "image/png",
      "uploads",
    );
    expect(send).toHaveBeenCalledOnce();
    expect(r.key).toBe("uploads/u1/file.png");
    expect(r.publicUrl).toContain("uploads/u1/file.png");
  });
});

describe("presignPut", () => {
  it("returns the signed URL string from getSignedUrl", async () => {
    getSignedUrlMock.mockResolvedValue(
      "https://acct123.r2.cloudflarestorage.com/x?signature=…",
    );
    const url = await presignPut("uploads/u1/file.png", "image/png");
    expect(url).toMatch(/r2\.cloudflarestorage\.com/);
    expect(getSignedUrlMock).toHaveBeenCalledOnce();
  });
});
