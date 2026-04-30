// client/app/(marketing)/templates/page.tsx — replace existing default export
import type { Metadata } from "next";

import { TEMPLATES } from "@/lib/templates/registry";

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
          Three templates at launch. Square format. Pre-tested at every Indic
          script for overflow. More formats and categories land in §11.
        </p>
      </div>
      <TemplatesGrid templates={TEMPLATES} />
    </section>
  );
}
