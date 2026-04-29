/**
 * Generation quota — TODO §11.2.
 *
 * Single source of truth for "can this user generate?". Called from inside
 * `/api/generate/copy` BEFORE the Groq call. Race-safe: uses an atomic
 * conditional UPDATE so two parallel generations can't double-spend the
 * same quota slot.
 *
 * On generation failure the route should call `decrementQuota` so the user
 * isn't charged for a failed run.
 *
 * Stub for now — concrete SQL lands when the route ships.
 */
import "server-only";

import { PLAN_LIMITS, type Plan } from "@/lib/types";

export function planLimit(plan: Plan): number {
  return PLAN_LIMITS[plan];
}

export type QuotaCheck = { allowed: boolean; remaining: number };

export async function checkAndIncrementQuota(
  _userId: string,
): Promise<QuotaCheck> {
  throw new Error(
    "checkAndIncrementQuota not implemented yet — see TODO §11.2",
  );
}

export async function decrementQuota(_userId: string): Promise<void> {
  throw new Error("decrementQuota not implemented yet — see TODO §11.2");
}
