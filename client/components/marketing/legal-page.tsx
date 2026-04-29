import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 py-16 sm:py-20 prose-invert">
      <header className="mb-10 pb-6 border-b border-border">
        <p className="text-label">Legal</p>
        <h1 className="text-h1 mt-2">{title}</h1>
        <p className="text-caption mt-2">Last updated: {updated}</p>
      </header>
      <div className="space-y-6 text-body text-muted-foreground [&_h2]:text-h3 [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline">
        {children}
      </div>
    </article>
  );
}
