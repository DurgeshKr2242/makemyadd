import { ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-h1">History</h1>
          <p className="text-body text-muted-foreground mt-2">
            Every ad you've made — re-download, remix, or share.
          </p>
        </div>
        <Button
          render={
            <Link href="/dashboard">
              <Plus /> New ad
            </Link>
          }
        />
      </div>

      {/* Empty state — list lands once §11.1 GET /api/generations is wired. */}
      <Card>
        <CardContent className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <ImageIcon
            className="h-10 w-10 text-muted-foreground"
            strokeWidth={1.25}
          />
          <p className="text-h3">No ads yet</p>
          <p className="text-body text-muted-foreground max-w-md">
            Drop a product photo to make your first one — your generations show
            up here.
          </p>
          <Button
            className="mt-2"
            render={<Link href="/dashboard">Make first ad</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
