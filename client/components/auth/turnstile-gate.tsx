"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { publicEnv } from "@/lib/env";

export interface TurnstileGateProps {
  /** Fires once Cloudflare returns a verified token. The token is opaque
   *  — pass straight to the server. */
  onVerified: (token: string) => void;
  /** Fires when the widget fails (offline / bad sitekey / expired). */
  onError?: (reason: string) => void;
  className?: string;
}

type GateState = "idle" | "verified" | "error" | "expired";

export function TurnstileGate({
  onVerified,
  onError,
  className,
}: TurnstileGateProps) {
  const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [state, setState] = useState<GateState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Dev mode: no site key — render an explanatory pill, don't block UX ────
  if (!siteKey) {
    return (
      <div
        className={`rounded-md border border-dashed border-border bg-background/50 px-3 py-2.5 text-caption flex items-center gap-2 ${className ?? ""}`}
      >
        <ShieldCheck
          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
          strokeWidth={1.75}
        />
        <span>
          Bot check is dev-bypassed (no{" "}
          <code className="text-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>).
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Turnstile
        siteKey={siteKey}
        options={{
          theme: "dark",
          size: "flexible",
          appearance: "always",
        }}
        onSuccess={(token) => {
          setState("verified");
          setErrorMessage(null);
          onVerified(token);
        }}
        onError={() => {
          setState("error");
          setErrorMessage("Bot check failed to load. Refresh and try again.");
          onError?.("widget_error");
        }}
        onExpire={() => {
          setState("expired");
          setErrorMessage("Bot check expired. Solve again to continue.");
        }}
      />

      {state === "verified" ? (
        <p className="flex items-center gap-1.5 text-caption text-success">
          <CheckCircle2 className="h-3 w-3" /> Bot check passed
        </p>
      ) : null}

      {state === "error" || state === "expired" ? (
        <p className="flex items-center gap-1.5 text-caption text-destructive">
          <ShieldAlert className="h-3 w-3" /> {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
