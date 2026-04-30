"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { boundary: "auth" } });
    console.error("[auth] route error:", error);
  }, [error]);

  return (
    <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-lg text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="text-h2">Sign-in error</h2>
      <p className="text-body-sm text-muted-foreground mt-3">
        Something went wrong loading the form. Try again, or head back to home.
      </p>
      {error.digest ? (
        <p className="text-mono text-caption mt-3">ref: {error.digest}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={reset}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
        <ButtonLink href="/" variant="outline" size="sm">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
