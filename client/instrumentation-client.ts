/**
 * Browser-side instrumentation hook. Imports the Sentry client config so
 * the SDK initialises before the React tree mounts.
 *
 * Next.js auto-loads this on the client when present.
 */
import * as Sentry from "@sentry/nextjs";

import "./sentry.client.config";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
