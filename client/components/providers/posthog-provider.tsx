"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";

import { publicEnv } from "@/lib/env";

let initialised = false;

function init() {
  if (typeof window === "undefined") return;
  if (initialised) return;
  const key = publicEnv.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: publicEnv.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    // Don't track users in dev — pollutes the dashboard
    loaded: (ph) => {
      if (process.env.NODE_ENV !== "production") ph.opt_out_capturing();
    },
  });
  initialised = true;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => init(), []);
  if (!publicEnv.NEXT_PUBLIC_POSTHOG_KEY) {
    // No key — render children directly, skip the provider entirely
    return <>{children}</>;
  }
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
