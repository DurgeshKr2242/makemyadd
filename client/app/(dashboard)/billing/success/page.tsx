import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Subscription activated",
};

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-screen-sm px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardContent className="py-12 flex flex-col items-center text-center gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="text-h2">Activating your plan…</h1>
          <p className="text-body text-muted-foreground max-w-sm">
            Razorpay confirmed payment. We're applying it to your account —
            usually under 10 seconds. (The webhook is the source of truth; this
            page polls.)
          </p>
          <div className="flex gap-2 mt-2">
            <Button render={<Link href="/dashboard">Make a new ad</Link>} />
            <Button
              variant="outline"
              render={<Link href="/billing">View plan</Link>}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
