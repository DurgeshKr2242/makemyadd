import type { ReactNode } from "react";

export function Step({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 sm:p-7">
      <div className="flex items-start gap-4 mb-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-mono text-muted-foreground tabular shrink-0">
          {n}
        </span>
        <div>
          <h2 className="text-h3">{title}</h2>
          <p className="text-caption">{body}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
