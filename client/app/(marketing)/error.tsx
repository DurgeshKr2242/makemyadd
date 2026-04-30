"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry capture is a no-op when NEXT_PUBLIC_SENTRY_DSN is unset.
    Sentry.captureException(error, { tags: { boundary: "marketing" } });
    console.error("[marketing] route error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h1 className="text-h1">
        Something <span className="text-serif text-destructive">broke</span>.
      </h1>
      <p className="text-body text-muted-foreground mt-4 max-w-md mx-auto">
        We hit an unexpected error rendering this page. The issue has been
        logged. Try reloading — if it keeps happening, drop us a line.
      </p>
      {error.digest ? (
        <p className="text-mono text-caption mt-3">ref: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
