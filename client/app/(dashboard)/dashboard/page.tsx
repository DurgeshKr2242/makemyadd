import type { Metadata } from "next";

import { DashboardShell } from "./dashboard-shell";

export const metadata: Metadata = {
  title: "Make an ad",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label mb-2">Studio</p>
          <h1 className="text-h1">
            Make a <span className="text-serif text-primary">new</span> ad.
          </h1>
        </div>
        <p className="text-caption max-w-md sm:text-right">
          Drop a product photo or paste a URL — the canvas updates live as you
          tune. Generate three localised copy variants in under thirty seconds.
        </p>
      </header>

      <DashboardShell />
    </div>
  );
}
