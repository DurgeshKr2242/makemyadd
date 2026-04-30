// client/app/api/generate/copy/route.ts
// Spec §8 — AI copy generation (headline/subheadline/CTA variants).
// Middleware at client/middleware.ts already gates /api/generate/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { CopyRequestSchema } from "@/lib/schemas/generation";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CopyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Turnstile bot-detection (optional token — missing means not required here).
  const ipHeader =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("x-forwarded-for") ??
    undefined;
  const ok = parsed.data.turnstileToken
    ? await verifyTurnstileToken(parsed.data.turnstileToken, ipHeader)
    : true;
  if (!ok) {
    return NextResponse.json({ error: "bot_detected" }, { status: 403 });
  }

  // Re-verify session to obtain the user id (middleware already ensured auth).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO §8 — implement copy generation:
  //   - Gate via lib/quota.ts (checkAndIncrementQuota) before calling Groq.
  //   - Build prompt in the user's selected language/tone/format.
  //   - Validate JSON output via CopyResponseSchema; retry up to 3× on failure.
  //   - On 3 consecutive failures, call decrementQuota + return copy_failed.
  //   - LLM outputs must never be stored without Zod validation passing.
  return NextResponse.json(
    { error: "not_implemented", spec: "§8" },
    { status: 501 },
  );
}
