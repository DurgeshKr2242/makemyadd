"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ExtractResponse,
  type ManualEntryInput,
  ManualEntrySchema,
} from "@/lib/schemas/generation";
import { CATEGORIES } from "@/lib/types";

import type { ManualEntryHint } from "./input-form";

export type { ManualEntryHint };

const SOURCE_HEADLINES: Record<ManualEntryHint["source"], string> = {
  url: "We couldn't read this page",
  photo: "We couldn't recognise the photo",
  user: "Tell us about the product",
};

const SOURCE_DESCRIPTIONS: Record<ManualEntryHint["source"], string> = {
  url: "The site might require a login or ship its product info in a way our scraper can't read. Type the basics below — we'll take it from there.",
  photo: "Our vision model couldn't classify the image. Type the basics below.",
  user: "Type a name and short description so we can write the copy.",
};

export interface ManualEntryDialogProps {
  open: boolean;
  hint: ManualEntryHint | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (extracted: ExtractResponse) => void;
}

export function ManualEntryDialog({
  open,
  hint,
  onOpenChange,
  onSubmit,
}: ManualEntryDialogProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(ManualEntrySchema),
    defaultValues: { productName: "", productDesc: "", category: undefined },
  });

  useEffect(() => {
    if (open && hint) {
      reset({
        productName: hint.defaultName ?? "",
        productDesc: hint.defaultDesc ?? "",
        category: undefined,
      });
    }
  }, [open, hint, reset]);

  const submit = (values: ManualEntryInput) => {
    startTransition(() => {
      const extracted: ExtractResponse = {
        productName: values.productName,
        productDesc: values.productDesc,
        productImageUrl:
          hint?.imageUrlIfAny ?? hint?.urlIfAny ?? "https://example.com",
        ...(values.category ? { category: values.category } : {}),
      };
      onSubmit(extracted);
      onOpenChange(false);
      reset();
    });
  };

  const source = hint?.source ?? "user";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h3">
            {SOURCE_HEADLINES[source]}
          </DialogTitle>
          <DialogDescription>{SOURCE_DESCRIPTIONS[source]}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="manual-name">Product name</Label>
            <Input
              id="manual-name"
              autoComplete="off"
              placeholder="Festival Saree"
              aria-invalid={Boolean(errors.productName)}
              {...register("productName")}
            />
            {errors.productName ? (
              <p className="text-caption text-destructive mt-1">
                {errors.productName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-desc">Short description</Label>
            <Textarea
              id="manual-desc"
              rows={3}
              placeholder="Hand-woven cotton saree, perfect for festival days."
              aria-invalid={Boolean(errors.productDesc)}
              {...register("productDesc")}
            />
            {errors.productDesc ? (
              <p className="text-caption text-destructive mt-1">
                {errors.productDesc.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-cat">Category (optional)</Label>
            <select
              id="manual-cat"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("category")}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Use these details"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
