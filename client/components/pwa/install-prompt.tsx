"use client";

import { ShareIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows a small install nudge:
 *   - On Chrome / Edge — captures `beforeinstallprompt` and renders an
 *     "Install app" button. Hidden on dismissal.
 *   - On iOS Safari — shows a one-line hint pointing at the share menu
 *     (the only way to install on iOS).
 * Hidden when the page is already running in standalone mode.
 *
 * Designed to slot into the dashboard's footer or settings sidebar
 * without dictating placement — render `<InstallPrompt />` wherever.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, _setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // Safari/iOS standalone signal
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true,
    );

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone || dismissed) return null;

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          await deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === "accepted" || outcome === "dismissed") {
            setDeferredPrompt(null);
          }
        }}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-1.5 text-caption text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-fast"
      >
        Install AdCreator
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="inline-flex items-center gap-2 rounded-md border border-dashed border-border bg-background/50 px-3 py-1.5 text-caption text-muted-foreground">
        <ShareIcon className="h-3.5 w-3.5" aria-hidden />
        <span>Tap Share, then "Add to Home Screen" to install.</span>
      </p>
    );
  }

  return null;
}
