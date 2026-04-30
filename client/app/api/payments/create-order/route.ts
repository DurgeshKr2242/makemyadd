// client/app/api/payments/create-order/route.ts
// Spec §12 — Create a Razorpay subscription order.
// Middleware at client/middleware.ts already gates /api/payments/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { CreateOrderRequestSchema } from "@/lib/schemas/payments";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateOrderRequestSchema.safeParse(body);
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

  // TODO §12 — implement Razorpay subscription creation:
  //   - Map { plan, billingCycle } → RAZORPAY_PLAN_* env var (plan id).
  //   - Create subscription via Razorpay API: POST /v1/subscriptions.
  //   - Persist pending subscription in DB (subscriptions table).
  //   - Return { subscriptionId, keyId } matching CreateOrderResponseSchema.
  return NextResponse.json(
    { error: "not_implemented", spec: "§12" },
    { status: 501 },
  );
}
