// client/app/api/turnstile/verify/route.ts
// Spec §13 — Real Turnstile verification endpoint (used by signup flow).
// No auth required — this is called before the user has a session.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyTurnstileToken } from "@/lib/turnstile";

const BodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ipHeader =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("x-forwarded-for") ??
    undefined;

  const success = await verifyTurnstileToken(parsed.data.token, ipHeader);

  return NextResponse.json({ success }, { status: 200 });
}
