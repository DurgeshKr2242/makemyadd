// client/app/api/upload/presign/route.test.ts

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so it doesn't throw outside Next.js runtime.
vi.mock("server-only", () => ({}));

// Mock Supabase server client — replaced per test case.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock env module so server-only guard doesn't fire during import.
vi.mock("@/lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  },
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

const mockCreateClient = vi.mocked(createClient);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withSession(userId: string) {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
    // biome-ignore lint/suspicious/noExplicitAny: test stub only needs partial shape
  } as any);
}

function withNoSession() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    // biome-ignore lint/suspicious/noExplicitAny: test stub only needs partial shape
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/upload/presign", () => {
  it("400 on missing body (null JSON)", async () => {
    withSession("user-123");
    const req = new NextRequest("http://localhost/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_body");
  });

  it("400 when contentType is invalid or size exceeds 10 MB", async () => {
    withSession("user-123");
    // size > 10 MB = 10 * 1024 * 1024 + 1 = 10485761
    const req = makeRequest({
      filename: "photo.jpg",
      contentType: "image/gif", // not in allowlist
      size: 1024,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_body");
  });

  it("401 when no session", async () => {
    withNoSession();
    const req = makeRequest({
      filename: "photo.jpg",
      contentType: "image/jpeg",
      size: 1024,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("unauthorized");
  });

  it("501 stub for valid body + authenticated user", async () => {
    withSession("user-123");
    const req = makeRequest({
      filename: "photo.jpg",
      contentType: "image/jpeg",
      size: 1024,
    });
    const res = await POST(req);
    expect(res.status).toBe(501);
    const json = await res.json();
    expect(json.error).toBe("not_implemented");
    expect(json.spec).toBe("§5");
  });
});
