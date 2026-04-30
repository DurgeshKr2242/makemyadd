import type { Metadata } from "next";

import { TemplatesGrid } from "./templates-grid";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse all available ad templates by category and format.",
};

export default function TemplatesPage() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <div className="max-w-2xl mb-12">
        <p className="text-label mb-4">Templates</p>
        <h1 className="text-display">
          Designs that <span className="text-serif text-primary">actually</span>{" "}
          fit.
        </h1>
        <p className="text-body text-muted-foreground mt-5 text-lg">
          Ten templates at launch. Three formats (1×1, 9×16, 4×5). Pre-tested at
          every Indic script for overflow. More variants land each release.
        </p>
      </div>
      <TemplatesGrid />
    </section>
  );
}
