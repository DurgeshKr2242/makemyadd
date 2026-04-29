/**
 * Razorpay plan ID lookup — TODO §12.1.
 *
 * Maps internal plan + cycle to the Razorpay-side plan_id stored in env.
 * The free plan has no Razorpay artefact.
 */
import "server-only";

import { serverEnv } from "@/lib/env.server";
import type { Plan } from "@/lib/types";

export type BillingCycle = "monthly" | "annual";

export function getRazorpayPlanId(plan: Plan, cycle: BillingCycle): string {
  if (plan === "free") {
    throw new Error("Free plan has no Razorpay plan id");
  }
  const map: Record<
    Exclude<Plan, "free">,
    Record<BillingCycle, string | undefined>
  > = {
    starter: {
      monthly: serverEnv.RAZORPAY_PLAN_STARTER,
      annual: serverEnv.RAZORPAY_PLAN_STARTER_ANNUAL,
    },
    pro: {
      monthly: serverEnv.RAZORPAY_PLAN_PRO,
      annual: serverEnv.RAZORPAY_PLAN_PRO_ANNUAL,
    },
    agency: {
      monthly: serverEnv.RAZORPAY_PLAN_AGENCY,
      annual: serverEnv.RAZORPAY_PLAN_AGENCY_ANNUAL,
    },
  };
  const id = map[plan][cycle];
  if (!id) {
    throw new Error(
      `Missing Razorpay plan id for ${plan}/${cycle}. Set RAZORPAY_PLAN_${plan.toUpperCase()}${cycle === "annual" ? "_ANNUAL" : ""} in env.`,
    );
  }
  return id;
}
