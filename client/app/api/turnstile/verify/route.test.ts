// client/app/api/turnstile/verify/route.test.ts

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so it doesn't throw outside Next.js runtime.
vi.mock("server-only", () => ({}));

// Mock the turnstile helper — we test the route plumbing, not the real fetch.
vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

// Mock env.server so server-only guard + Zod parse don't run in test env.
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    TURNSTILE_SECRET_KEY: "test-secret",
  },
}));

import { verifyTurnstileToken } from "@/lib/turnstile";
import { POST } from "./route";

const mockVerify = vi.mocked(verifyTurnstileToken);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/turnstile/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/turnstile/verify", () => {
  it("400 on missing token", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_body");
  });

  it("200 + { success: true } when verifyTurnstileToken returns true", async () => {
    mockVerify.mockResolvedValue(true);
    const req = makeRequest({ token: "valid-token" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockVerify).toHaveBeenCalledWith("valid-token", undefined);
  });

  it("200 + { success: false } when verifyTurnstileToken returns false", async () => {
    mockVerify.mockResolvedValue(false);
    const req = makeRequest({ token: "bad-token" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(mockVerify).toHaveBeenCalledWith("bad-token", undefined);
  });
});
