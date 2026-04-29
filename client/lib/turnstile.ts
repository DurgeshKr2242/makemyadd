/**
 * Cloudflare Turnstile verification — TODO §13.
 *
 * Server-side verification of the token returned by the `<Turnstile>`
 * widget. Returns `true` only on success — call from any route that takes
 * user input from the public internet (signup, copy generation).
 */
import "server-only";

import { serverEnv } from "@/lib/env.server";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Dev / scaffolding mode — let everything through but log loudly.
    console.warn(
      "[turnstile] TURNSTILE_SECRET_KEY not set — allowing request through.",
    );
    return true;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const json = (await res.json()) as { success: boolean };
    return Boolean(json.success);
  } catch {
    return false;
  }
}
