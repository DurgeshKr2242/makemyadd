"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "dashboard" } });
    console.error("[dashboard] route error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-h2">
          Something <span className="text-serif text-destructive">broke</span>{" "}
          in the studio.
        </h1>
        <p className="text-body text-muted-foreground mt-3 max-w-md mx-auto">
          We hit an unexpected error rendering this page. The issue has been
          logged. Try reloading — if it persists, drop us a line at{" "}
          <a
            href="mailto:hello@adcreator.in"
            className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
          >
            hello@adcreator.in
          </a>
          .
        </p>
        {error.digest ? (
          <p className="text-mono text-caption mt-3">ref: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <ButtonLink href="/dashboard" variant="outline">
            Back to dashboard
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
