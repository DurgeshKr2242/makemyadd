// client/app/api/upload/presign/route.ts
// Spec §5 / §11.1 — R2 presigned upload URL.
// Middleware at client/middleware.ts already gates /api/upload/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

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

  // Re-verify session to obtain the user id (middleware already ensured auth).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO §5 — implement R2 presign:
  //   - Build key: uploads/{user.id}/{crypto.randomUUID()}.{ext}
  //   - getSignedUrl(r2, new PutObjectCommand({...}), { expiresIn: 300 })
  //   - Return { presignedUrl, key, publicUrl }
  return NextResponse.json(
    { error: "not_implemented", spec: "§5" },
    { status: 501 },
  );
}
