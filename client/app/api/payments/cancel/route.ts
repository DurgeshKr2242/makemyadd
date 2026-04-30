// client/app/api/payments/cancel/route.ts
// Spec §12.5 — Cancel the current user's active Razorpay subscription.
// Middleware at client/middleware.ts already gates /api/payments/** for auth.
import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  // Re-verify session to obtain the user id (middleware already ensured auth).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // TODO §12.5 — implement subscription cancellation:
  //   - Look up the user's active subscription id from the subscriptions table.
  //   - Call Razorpay API: POST /v1/subscriptions/{id}/cancel
  //     with { cancel_at_cycle_end: true } so they keep access until period end.
  //   - Update DB status to "cancel_pending".
  //   - The webhook (subscription.cancelled) will flip it to "cancelled".
  return NextResponse.json(
    { error: "not_implemented", spec: "§12.5" },
    { status: 501 },
  );
}
