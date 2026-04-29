import { ImageIcon } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse all available ad templates by category and format.",
};

const PLACEHOLDER = Array.from({ length: 12 }).map((_, i) => ({
  id: `placeholder-${i}`,
  name: ["Festival Bright", "Clean Minimal", "Trust Badge", "Urgency Red"][
    i % 4
  ],
  category: ["sale", "showcase", "trust", "urgency"][i % 4],
  format: ["1×1", "9×16", "4×5"][i % 3],
}));

export default function TemplatesPage() {
  return (
    <section className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="max-w-2xl mb-10">
        <h1 className="text-h1">Templates</h1>
        <p className="text-body text-muted-foreground mt-2">
          12 templates at launch — 4 categories × 3 formats. All
          Indic-script-safe; pre-tested with Devanagari, Tamil, and Telugu copy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {PLACEHOLDER.map((t) => (
          <Card
            key={t.id}
            className="overflow-hidden hover:bg-accent transition-colors duration-fast"
          >
            <div className="aspect-square bg-muted flex items-center justify-center border-b border-border">
              <ImageIcon
                className="h-10 w-10 text-muted-foreground"
                strokeWidth={1.25}
              />
            </div>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body font-medium">{t.name}</span>
                <Badge
                  variant="outline"
                  className="font-mono uppercase text-[10px]"
                >
                  {t.format}
                </Badge>
              </div>
              <p className="text-caption capitalize">{t.category}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-caption mt-10">
        Real previews land once Section §11 of TODO.md ships (template seed + R2
        thumbnails).
      </p>
    </section>
  );
}
