import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

import { DashboardShell } from "./dashboard-shell";

export const metadata: Metadata = {
  title: "Make an ad",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-label mb-3">Studio</p>
          <h1 className="text-h1">
            Make a <span className="text-serif text-primary">new</span> ad.
          </h1>
          <p className="text-body text-muted-foreground mt-3 max-w-xl">
            Drop a product photo or paste a URL — we handle the background, the
            copy, and the composition. Your preview is live in 30 seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Save draft
        </Button>
      </div>

      <DashboardShell />
    </div>
  );
}
