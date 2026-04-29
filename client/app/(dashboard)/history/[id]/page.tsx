import { ArrowLeft, Download, Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Generation",
};

export default async function GenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          render={
            <Link href="/history">
              <ArrowLeft /> Back
            </Link>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generation</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                {id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-caption">
              Final ad image renders here once §11.1 GET /api/generations/[id]
              lands.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button className="w-full">
            <Download /> Download
          </Button>
          <Button variant="outline" className="w-full">
            <Wand2 /> Remix
          </Button>
        </div>
      </div>
    </div>
  );
}
