"use client";

import { ArrowUpRight, Check, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export interface PlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Highlight which plan is "recommended" — defaults to "starter". */
  recommended?: Exclude<PlanId, "free">;
}

export function PlanModal({
  open,
  onOpenChange,
  recommended = "starter",
}: PlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl sm:max-w-2xl gap-0 p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-border gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <p className="text-label">Upgrade</p>
              </div>

              <DialogTitle className="text-h2 leading-snug">
                You're at the{" "}
                <span className="text-serif text-primary italic">limit</span> of
                free generations.
              </DialogTitle>

              <DialogDescription className="text-body text-muted-foreground mt-1">
                Upgrade to keep making ads. All plans cancel anytime.
              </DialogDescription>
            </div>

            {/* Close button — accessible */}
            <DialogClose
              render={
                <button
                  type="button"
                  className="shrink-0 mt-0.5 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              }
            />
          </div>
        </DialogHeader>

        {/* Plan grid */}
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => {
              const isRecommended = plan.id === recommended;

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-5 transition-colors duration-fast",
                    isRecommended
                      ? "border-primary shadow-glow bg-card"
                      : "border-border bg-card hover:bg-accent/30",
                  )}
                >
                  {isRecommended ? (
                    <Badge className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest">
                      Recommended
                    </Badge>
                  ) : null}

                  {/* Plan header */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-label">{plan.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-h3 tabular-nums">
                          ₹{plan.price}
                        </span>
                        <span className="text-caption">{plan.cadence}</span>
                      </div>
                    </div>
                    <p className="text-caption mt-0.5">{plan.description}</p>
                  </div>

                  {/* Perks */}
                  <ul className="space-y-2 text-body-sm flex-1 mb-5">
                    {plan.perks.map((perk) => (
                      <li
                        key={perk.text}
                        className={cn(
                          "flex gap-2.5 items-start",
                          perk.ok
                            ? "text-foreground"
                            : "text-muted-foreground line-through",
                        )}
                      >
                        {perk.ok ? (
                          <Check
                            className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5"
                            strokeWidth={2}
                          />
                        ) : (
                          <X
                            className="h-3.5 w-3.5 shrink-0 mt-0.5"
                            strokeWidth={2}
                          />
                        )}
                        <span>{perk.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <ButtonLink
                    href={plan.cta.href}
                    variant={plan.cta.variant}
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => onOpenChange(false)}
                  >
                    Choose {plan.name}
                    {plan.cta.variant === "default" ? (
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        strokeWidth={1.75}
                      />
                    ) : null}
                  </ButtonLink>
                </article>
              );
            })}
          </div>

          <p className="text-caption text-center mt-4">
            All prices in INR · Cancel anytime · Access lasts through billing
            period
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
