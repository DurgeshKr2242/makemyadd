/**
 * Payment-related Zod schemas — TODO §12.
 */
import { z } from "zod";

import { PLANS } from "@/lib/types";

const PAID_PLANS = PLANS.filter(
  (p): p is Exclude<(typeof PLANS)[number], "free"> => p !== "free",
);

export const CreateOrderRequestSchema = z.object({
  plan: z.enum(PAID_PLANS as ["starter", "pro", "agency"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const CreateOrderResponseSchema = z.object({
  subscriptionId: z.string().min(1),
  keyId: z.string().min(1),
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;
