/**
 * Server-side PostHog client (Node SDK).
 *
 * Inert when NEXT_PUBLIC_POSTHOG_KEY is unset. Use this from Server
 * Components, Route Handlers, and Server Actions. Browser-side capture
 * is wired separately via posthog-js in the PostHogProvider client
 * island.
 */
import "server-only";
import { PostHog } from "posthog-node";

import { publicEnv } from "@/lib/env";

let cachedClient: PostHog | null = null;

export function getServerPostHog(): PostHog | null {
  const key = publicEnv.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new PostHog(key, {
    host: publicEnv.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return cachedClient;
}

/** Fire-and-forget capture. No-op when PostHog isn't configured. */
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = getServerPostHog();
  if (!client) return;
  client.capture({ event, distinctId, properties });
  await client.shutdown(); // ensure events flush before serverless cold-stop
}
