// client/app/api/upload/presign/route.ts
// Spec §5 / §11.1 — R2 presigned upload URL.
// Middleware at client/middleware.ts already gates /api/upload/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { isR2Configured, presignPut, publicUrl } from "@/lib/r2/client";
import { uploadKey } from "@/lib/r2/keys";
import { PresignRequestSchema } from "@/lib/schemas/generation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = PresignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error: "r2_not_configured",
        message:
          "Photo upload isn't configured for this environment yet. Try again later or paste a product URL.",
      },
      { status: 503 },
    );
  }

  // ext: prefer the part after the last dot in the filename, falling back
  // to the contentType subtype. uploadKey() throws on non-alphanumeric ext.
  const fromName = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "";
  const fromType = parsed.data.contentType.split("/")[1]?.toLowerCase() ?? "";
  const ext = /^[a-z0-9]+$/.test(fromName) ? fromName : fromType;

  const key = uploadKey(user.id, ext);
  const presignedUrl = await presignPut(key, parsed.data.contentType);
  return NextResponse.json({
    presignedUrl,
    key,
    publicUrl: publicUrl(key, "uploads"),
  });
}
