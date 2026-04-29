/**
 * Razorpay server client — TODO §12.
 *
 * Stub. Real wiring lands with `/api/payments/create-order` and the webhook
 * handler (§12.2 / §12.4).
 */
import "server-only";

import { requireServerEnv } from "@/lib/env.server";

let cachedClient: unknown = null;

export async function getRazorpayClient() {
  if (cachedClient) return cachedClient;
  const key_id = requireServerEnv("RAZORPAY_KEY_ID");
  const key_secret = requireServerEnv("RAZORPAY_KEY_SECRET");
  const { default: Razorpay } = await import("razorpay");
  cachedClient = new Razorpay({ key_id, key_secret });
  return cachedClient as InstanceType<typeof Razorpay>;
}
