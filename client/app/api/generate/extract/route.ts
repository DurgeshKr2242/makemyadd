// client/app/api/generate/extract/route.ts
// Spec §6 — Extract product info from URL or uploaded photo.
// Middleware at client/middleware.ts already gates /api/generate/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { ExtractRequestSchema } from "@/lib/schemas/generation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = ExtractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Re-verify session to obtain the user id (middleware already ensured auth).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO §6 — implement product extraction:
  //   - If inputType === "url": fetch page, SSRF-guard against private IPs,
  //     call Groq vision model to extract product info.
  //   - If inputType === "photo": retrieve imageKey from R2, call Groq.
  //   - Validate output via ExtractResponseSchema (Zod), retry up to 3×.
  //   - On quota exhaustion, return 429.
  return NextResponse.json(
    { error: "not_implemented", spec: "§6" },
    { status: 501 },
  );
}
