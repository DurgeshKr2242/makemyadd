import { ArrowRight, Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Billing",
};

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "₹0",
    cadence: "forever",
    perks: ["5 generations / month", "English & Hindi", "Watermark on output"],
    cta: "Current plan",
    variant: "outline" as const,
    current: true,
  },
  {
    id: "starter" as const,
    name: "Starter",
    price: "₹499",
    cadence: "/month",
    perks: ["50 generations / month", "All 4 languages", "No watermark · HD"],
    cta: "Upgrade to Starter",
    variant: "default" as const,
    current: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "₹1,199",
    cadence: "/month",
    perks: ["200 generations / month", "Brand kit (Phase 2)", "Priority queue"],
    cta: "Upgrade to Pro",
    variant: "secondary" as const,
    current: false,
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: "₹2,999",
    cadence: "/month",
    perks: ["Unlimited generations", "Bulk generation", "API access (Phase 2)"],
    cta: "Talk to us",
    variant: "outline" as const,
    current: false,
  },
];

export default function BillingPage() {
  const used = 0;
  const limit = 5;
  const pct =
    limit === Number.POSITIVE_INFINITY ? 0 : Math.round((used / limit) * 100);

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      <div>
        <h1 className="text-h1">Billing</h1>
        <p className="text-body text-muted-foreground mt-2">
          Manage your plan, usage, and invoices.
        </p>
      </div>

      {/* Usage card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">This month</CardTitle>
          <CardDescription>
            Resets on the first day of each billing period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-h2 tabular">{used}</span>
            <span className="text-body-sm text-muted-foreground tabular">
              of {limit} generations
            </span>
          </div>
          <Progress value={pct} />
        </CardContent>
      </Card>

      {/* Plan grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={plan.current ? "border-primary shadow-glow" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.current ? <Badge>Current</Badge> : null}
              </div>
              <CardDescription>
                <span className="text-h2 tabular text-foreground">
                  {plan.price}
                </span>
                <span className="text-body text-muted-foreground">
                  {" "}
                  {plan.cadence}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-body-sm text-muted-foreground">
                {plan.perks.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant={plan.variant}
                className="w-full"
                disabled={plan.current}
              >
                {plan.cta}
                {!plan.current && plan.variant === "default" ? (
                  <ArrowRight />
                ) : null}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-h3">Cancel subscription</CardTitle>
          <CardDescription>
            Cancellation takes effect at the end of the current billing period —
            you keep access until then.{" "}
            <Link href="/legal/refund" className="text-primary hover:underline">
              Refund policy
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" disabled>
            <X /> Cancel subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
