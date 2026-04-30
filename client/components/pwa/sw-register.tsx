"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on first paint. No-ops in dev to avoid stale caches
 * masking source-code edits.
 *
 * Mounted in the root layout. The registration runs after hydration so
 * it never blocks initial render.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Defer to after-load so the SW install never competes with critical
    // hydration work.
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) => {
          console.warn("[sw] registration failed:", err);
        });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
