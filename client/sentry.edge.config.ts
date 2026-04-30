/**
 * Sentry Edge runtime init (middleware.ts + edge route handlers like the
 * OG image renderers). Smaller surface than the Node SDK.
 *
 * Inert when SENTRY_DSN is unset.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}
