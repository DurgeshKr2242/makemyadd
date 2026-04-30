/**
 * Sentry browser SDK init.
 *
 * Inert when NEXT_PUBLIC_SENTRY_DSN is empty / unset (the same env-coerce
 * pattern as the rest of lib/env.ts). Activates the moment the DSN lands
 * in Vercel's environment.
 */
import * as Sentry from "@sentry/nextjs";

import { publicEnv } from "@/lib/env";

const dsn = publicEnv.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Performance — keep modest at MVP. Crank up once we have traffic data.
    tracesSampleRate: 0.1,
    // Session replay — error-only at MVP to keep cost down.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Don't ship dev errors — they pollute the dashboard with HMR noise.
    enabled: process.env.NODE_ENV === "production",
  });
}
