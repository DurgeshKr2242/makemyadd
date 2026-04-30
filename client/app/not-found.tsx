import { ArrowUpRight, Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 py-24 text-center flex flex-col items-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Compass className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <p className="text-display-serif text-foreground tabular leading-none">
        404
      </p>
      <h1 className="text-h1 mt-4">Page not found.</h1>
      <p className="text-body text-muted-foreground mt-4 max-w-md">
        The link is broken or the page moved. Head back to the start, or browse
        what's there.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">
          Back to home <ArrowUpRight />
        </ButtonLink>
        <ButtonLink href="/templates" variant="outline">
          Browse templates
        </ButtonLink>
      </div>
    </main>
  );
}
