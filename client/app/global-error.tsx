"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches crashes in the root layout itself (provider init failures,
 * font loader throws, anything that explodes above the route-group
 * error boundaries).
 *
 * Replaces the entire DOM, so it must include its own <html> and
 * <body> tags. Uses inline styles only — globals.css may not have
 * loaded if we got here, and we don't want a missing stylesheet to
 * make the crash page itself crash.
 *
 * Per Next 16: error boundaries are Client Components, so metadata
 * exports are not supported here. The React 19 <title> component
 * sets the tab title instead.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // No-op when DSN unset — see lib/env.ts
    Sentry.captureException(error, { tags: { boundary: "global" } });
    console.error("[global] root layout crashed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a14",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          padding: "24px",
        }}
      >
        <title>Something went wrong — AdCreator</title>
        <main style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#a1a1aa",
              marginBottom: 16,
            }}
          >
            Crash
          </p>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: -1.5,
              marginTop: 0,
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            Something went sideways.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#a1a1aa",
              lineHeight: 1.5,
              marginBottom: 32,
            }}
          >
            The app crashed before it could render. The error has been logged.
            Try again — if it keeps happening, drop us a line.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 12,
                color: "#71717a",
                marginBottom: 24,
              }}
            >
              ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#FF7A2E",
              color: "#1a0e02",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
