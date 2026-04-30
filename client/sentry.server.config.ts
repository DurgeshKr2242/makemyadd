/**
 * Sentry Node.js SDK init (Route Handlers, Server Components, Server Actions).
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
    // Don't ship local-dev request bodies if someone runs prod locally.
    sendDefaultPii: false,
  });
}
