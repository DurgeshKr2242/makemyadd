// client/app/api/generate/bgremove/route.ts
// Spec §7 — Background removal via HuggingFace (cached by perceptual hash).
// Middleware at client/middleware.ts already gates /api/generate/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { BgRemoveRequestSchema } from "@/lib/schemas/generation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BgRemoveRequestSchema.safeParse(body);
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

  // TODO §7 — implement background removal:
  //   - Check image_cache table (perceptual hash) before calling HuggingFace.
  //   - Wrap HF call in AbortController with 7s budget (Vercel function limit).
  //   - Store result in R2 + image_cache.
  //   - Return { bgRemovedUrl, fromCache }.
  return NextResponse.json(
    { error: "not_implemented", spec: "§7" },
    { status: 501 },
  );
}
