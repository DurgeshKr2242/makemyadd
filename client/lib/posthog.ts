/**
 * PostHog client — TODO §18.
 *
 * Stub. Browser-side `posthog-js` initialisation lands when analytics
 * tracking is wired (signup → first generation funnel).
 */
import { publicEnv } from "@/lib/env";

export function isPostHogConfigured(): boolean {
  return Boolean(publicEnv.NEXT_PUBLIC_POSTHOG_KEY);
}
