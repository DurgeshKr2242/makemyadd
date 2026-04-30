"use client";

import { AlertCircle } from "lucide-react";

import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates } from "@/lib/queries/templates";

const SAMPLE = {
  headline: "Festival Sale",
  subheadline: "Limited time · Free delivery",
  cta: "Shop Now",
};

const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' rx='32' fill='%23e5e7eb'/><text x='50%25' y='52%25' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23111'>Sample</text></svg>`,
  );

export function TemplatesGrid() {
  const {
    data: templates,
    isPending,
    isError,
    error,
    refetch,
  } = useTemplates();

  if (isPending) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => `t-${i}`).map((id) => (
          <article
            key={id}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <Skeleton className="aspect-square w-full mb-4 rounded-xl" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-3 w-20 mt-2" />
          </article>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Couldn't load templates</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error"}.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline-offset-4 hover:underline text-foreground"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <article
          key={t.id}
          className="bg-card border border-border rounded-2xl p-6 hover:bg-accent transition-colors duration-fast"
        >
          <div className="flex justify-center mb-4">
            <FabricCanvas
              template={t}
              productImageUrl={SAMPLE_IMAGE}
              copy={SAMPLE}
              language="en"
              displayWidth={280}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium">{t.name}</span>
            <Badge
              variant="outline"
              className="font-mono uppercase text-[10px] tracking-wider"
            >
              {t.format}
            </Badge>
          </div>
          <p className="text-caption capitalize mt-1">{t.category}</p>
        </article>
      ))}
    </div>
  );
}
