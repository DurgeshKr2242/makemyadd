import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepKey =
  | "upload"
  | "extract"
  | "bgremove"
  | "copy"
  | "render"
  | "done";
export type StepStatus = "pending" | "running" | "done" | "failed";

export interface ProgressStep {
  key: StepKey;
  label: string;
  status: StepStatus;
}

export interface ProgressStepperProps {
  steps: ProgressStep[];
  className?: string;
}

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30 transition-all duration-base">
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-1 ring-destructive/30 transition-all duration-base">
        <X className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "running") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40 transition-all duration-base">
        <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" />
      </span>
    );
  }

  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border transition-all duration-base">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
    </span>
  );
}

function stepLabelClass(status: StepStatus) {
  return cn(
    "transition-colors duration-fast",
    status === "running" && "text-primary font-medium",
    status === "done" && "text-success",
    status === "failed" && "text-destructive",
    status === "pending" && "text-muted-foreground",
  );
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <>
      {/* Mobile: vertical list */}
      <ol
        className={cn("flex flex-col gap-2 md:hidden", className)}
        aria-label="Generation progress"
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <StepIndicator status={step.status} />
                <span
                  className={cn("text-body-sm", stepLabelClass(step.status))}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "ms-[9px] mt-1 mb-1 w-px h-3 transition-colors duration-base",
                    step.status === "done" ? "bg-success/40" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Desktop: horizontal row — indicators on top, labels below */}
      <div className={cn("hidden md:block", className)}>
        {/* Row 1: connectors + indicators */}
        <div className="flex items-center">
          {steps.map((step, i) => {
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;
            const prevDone =
              i > 0 &&
              (steps[i - 1]?.status === "done" ||
                steps[i - 1]?.status === "running");
            return (
              <div key={step.key} className="flex flex-1 items-center">
                {/* Left connector */}
                <div
                  className={cn(
                    "h-px flex-1 transition-colors duration-base",
                    isFirst ? "opacity-0" : "",
                    prevDone ? "bg-primary/35" : "bg-border",
                  )}
                />
                <StepIndicator status={step.status} />
                {/* Right connector */}
                <div
                  className={cn(
                    "h-px flex-1 transition-colors duration-base",
                    isLast ? "opacity-0" : "",
                    step.status === "done" ? "bg-primary/35" : "bg-border",
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Row 2: labels */}
        <div className="flex mt-1.5">
          {steps.map((step) => (
            <div key={step.key} className="flex flex-1 justify-center">
              <span
                className={cn(
                  "text-caption text-center",
                  stepLabelClass(step.status),
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
