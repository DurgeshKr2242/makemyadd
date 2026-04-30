// client/app/api/payments/webhook/route.ts
// Spec §12.4 — Razorpay webhook receiver.
// NO middleware auth — webhooks are authenticated via HMAC-SHA256 signature.
// HMAC must be verified BEFORE any processing; fail-closed on missing secret.
import "server-only";

import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";

export async function POST(request: NextRequest) {
  // Read raw body BEFORE parsing JSON — HMAC is computed over the raw bytes.
  const rawBody = await request.text();

  const secret = serverEnv.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: a misconfigured deployment must not silently accept webhooks.
    console.error(
      "[payments/webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting request.",
    );
    return NextResponse.json(
      { error: "service_misconfigured", detail: "webhook secret not set" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison prevents timing-oracle attacks.
  const sigBuffer = Buffer.from(signature, "hex");
  const expBuffer = Buffer.from(expected, "hex");

  const signaturesMatch =
    sigBuffer.length === expBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expBuffer);

  if (!signaturesMatch) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // TODO §12.4 — implement webhook event handling:
  //   - Parse rawBody as JSON after HMAC passes (safe at this point).
  //   - Handle events: subscription.activated, subscription.charged,
  //     subscription.cancelled, subscription.completed.
  //   - Update subscriptions + user_plans tables via admin client (bypasses RLS).
  //   - The webhook is the ONLY source of truth for plan changes — do NOT grant
  //     access from the client-side checkout success handler.
  return NextResponse.json(
    { error: "not_implemented", spec: "§12.4" },
    { status: 501 },
  );
}
