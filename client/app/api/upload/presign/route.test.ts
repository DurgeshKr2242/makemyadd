import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  }),
}));

// vi.hoisted lifts these alongside vi.mock so the factory can reference them.
const { isR2ConfiguredMock, presignPutMock, publicUrlMock } = vi.hoisted(
  () => ({
    isR2ConfiguredMock: vi.fn().mockReturnValue(true),
    presignPutMock: vi
      .fn()
      .mockResolvedValue("https://acct123.r2.cloudflarestorage.com/signed?x=1"),
    publicUrlMock: vi
      .fn()
      .mockImplementation((k: string) => `https://assets.adcreator.in/${k}`),
  }),
);

vi.mock("@/lib/r2/client", () => ({
  isR2Configured: isR2ConfiguredMock,
  presignPut: presignPutMock,
  publicUrl: publicUrlMock,
}));

beforeEach(() => {
  isR2ConfiguredMock.mockReturnValue(true);
  presignPutMock.mockResolvedValue(
    "https://acct123.r2.cloudflarestorage.com/signed?x=1",
  );
  publicUrlMock.mockImplementation(
    (k: string) => `https://assets.adcreator.in/${k}`,
  );
});
afterEach(() => vi.restoreAllMocks());

import { POST } from "./route";

function reqJson(body: unknown): Request {
  return new Request("http://localhost/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/presign", () => {
  it("400s on body that doesn't match the schema", async () => {
    const res = await POST(reqJson({}) as never);
    expect(res.status).toBe(400);
  });

  it("400s on rejected content-type", async () => {
    const res = await POST(
      reqJson({
        filename: "x.heic",
        contentType: "image/heic",
        size: 1024,
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("503s when R2 isn't configured", async () => {
    isR2ConfiguredMock.mockReturnValueOnce(false);
    const res = await POST(
      reqJson({
        filename: "x.png",
        contentType: "image/png",
        size: 1024,
      }) as never,
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("r2_not_configured");
  });

  it("returns presignedUrl + key + publicUrl on success", async () => {
    const res = await POST(
      reqJson({
        filename: "festival.png",
        contentType: "image/png",
        size: 256_000,
      }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.presignedUrl).toMatch(/r2\.cloudflarestorage\.com/);
    expect(json.key).toMatch(/^uploads\/user-1\/[a-f0-9-]+\.png$/);
    expect(json.publicUrl).toContain(json.key);
  });
});
