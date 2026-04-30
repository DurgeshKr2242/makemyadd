// client/app/api/payments/webhook/route.test.ts
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only so it doesn't throw outside Next.js runtime.
vi.mock("server-only", () => ({}));

// We'll control what serverEnv returns per test.
const mockServerEnv = vi.hoisted(() => ({
  serverEnv: { RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret" },
}));

vi.mock("@/lib/env.server", () => mockServerEnv);

import { POST } from "./route";

const WEBHOOK_SECRET = "test-webhook-secret";

function makeSignedRequest(body: string, secret: string): NextRequest {
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": sig,
    },
    body,
  });
}

function makeUnsignedRequest(body: string): NextRequest {
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to a valid secret between tests.
  mockServerEnv.serverEnv.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

describe("POST /api/payments/webhook", () => {
  it("400 on missing or invalid HMAC signature", async () => {
    const body = JSON.stringify({ event: "subscription.activated" });
    const req = makeUnsignedRequest(body);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_signature");
  });

  it("503 when RAZORPAY_WEBHOOK_SECRET is not set", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: overriding optional field for test
    (mockServerEnv.serverEnv as any).RAZORPAY_WEBHOOK_SECRET = undefined;
    const body = JSON.stringify({ event: "subscription.activated" });
    const req = makeUnsignedRequest(body);
    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("service_misconfigured");
  });

  it("501 stub after HMAC passes", async () => {
    const body = JSON.stringify({ event: "subscription.activated" });
    const req = makeSignedRequest(body, WEBHOOK_SECRET);
    const res = await POST(req);
    expect(res.status).toBe(501);
    const json = await res.json();
    expect(json.error).toBe("not_implemented");
    expect(json.spec).toBe("§12.4");
  });
});
