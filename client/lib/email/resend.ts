/**
 * Resend server client. Lazy-loaded — only constructed when an email
 * actually fires. Throws helpfully if RESEND_API_KEY is unset and you
 * try to send.
 */
import "server-only";

import { requireServerEnv, serverEnv } from "@/lib/env.server";

let cachedClient: import("resend").Resend | null = null;

export async function getResendClient() {
  if (cachedClient) return cachedClient;
  const apiKey = requireServerEnv("RESEND_API_KEY");
  const { Resend } = await import("resend");
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

/** Convenience: returns true if Resend is configured + ready to send. */
export function isResendConfigured(): boolean {
  return Boolean(serverEnv.RESEND_API_KEY);
}
