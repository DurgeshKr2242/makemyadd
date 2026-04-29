import { ImageIcon, Link2, Sparkles, Upload } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Make an ad",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Header */}
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

      <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
        {/* Left — input column */}
        <div className="space-y-6">
          <Step
            n="01"
            title="Product"
            body="Upload an image or paste a product URL"
          >
            <Tabs defaultValue="upload">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex-1">
                  <Link2 className="h-3.5 w-3.5" />
                  URL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-4">
                <div className="rounded-xl border border-dashed border-input p-10 flex flex-col items-center justify-center text-center gap-3 transition-colors duration-fast hover:bg-accent/40">
                  <ImageIcon
                    className="h-8 w-8 text-muted-foreground"
                    strokeWidth={1.25}
                  />
                  <p className="text-body-sm">
                    Drop a JPG, PNG, or WEBP up to 10 MB
                  </p>
                  <Button size="sm" disabled>
                    Choose file
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="url" className="mt-4">
                <div className="rounded-xl border border-dashed border-input p-10 text-center">
                  <p className="text-body-sm text-muted-foreground">
                    URL extraction lands in TODO §6.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </Step>

          <Step
            n="02"
            title="Language & tone"
            body="Native script, never translated"
          >
            <p className="text-caption">Language picker lands with §10.</p>
          </Step>

          <Step
            n="03"
            title="Template"
            body="Pick a starting point — switch anytime"
          >
            <p className="text-caption">Template grid lands with §11.</p>
          </Step>
        </div>

        {/* Right — preview */}
        <div>
          <div className="sticky top-20">
            <div className="spotlight-card relative bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <p className="text-label">Live preview</p>
                <Badge
                  variant="outline"
                  className="font-mono uppercase text-[10px] tracking-wider"
                >
                  1 × 1 · 1080
                </Badge>
              </div>

              <div className="relative aspect-square rounded-2xl overflow-hidden bg-background border border-dashed border-input">
                <div
                  className="absolute inset-0 gradient-aurora opacity-50"
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 p-8">
                  <Sparkles
                    className="h-8 w-8 text-muted-foreground"
                    strokeWidth={1.25}
                  />
                  <p className="text-body-sm text-muted-foreground max-w-xs">
                    Your ad preview will render here once Fabric.js wires up
                    (TODO §11).
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" disabled>
                  Download
                </Button>
                <Button disabled>
                  <Sparkles /> Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: React.ReactNode;
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
