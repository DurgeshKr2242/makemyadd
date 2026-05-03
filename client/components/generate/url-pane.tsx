"use client";

import { Globe, X } from "lucide-react";
import { useState } from "react";
import type {
  InputValue,
  ManualEntryHint,
} from "@/components/generate/input-form";
import { isAcceptableProductUrl } from "@/components/generate/input-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExtractResponse } from "@/lib/schemas/generation";

export interface UrlPaneProps {
  value: InputValue;
  onChange: (v: InputValue) => void;
  onProductExtracted?: (product: ExtractResponse) => void;
  /** Set in Task 13 — opens the manual-entry dialog when scrape returns
   *  a fallback-eligible error code. Optional so this component compiles
   *  ahead of the dashboard wiring. */
  onRequestManualEntry?: (hint: ManualEntryHint) => void;
}

type ExtractState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export function UrlPane({
  value,
  onChange,
  onProductExtracted,
  onRequestManualEntry: _onRequestManualEntry,
}: UrlPaneProps) {
  const [draft, setDraft] = useState(value.type === "url" ? value.url : "");
  const [error, setError] = useState<string | null>(null);
  const [extractState, setExtractState] = useState<ExtractState>({
    status: "idle",
  });

  // "Selected" URL card — shown when extraction succeeded or URL was set
  if (value.type === "url") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted border border-border flex items-center justify-center">
          <Globe className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium truncate">{value.url}</p>
          <p className="text-caption mt-0.5">Product URL</p>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear URL"
          onClick={() => {
            setDraft("");
            setExtractState({ status: "idle" });
            onChange({ type: "empty" });
          }}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    const validationError = isAcceptableProductUrl(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setExtractState({ status: "loading" });

    try {
      const res = await fetch("/api/generate/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType: "url", inputUrl: trimmed }),
      });

      if (res.ok) {
        const product = (await res.json()) as ExtractResponse;
        // Surface the extracted data to the parent before marking URL as set
        onProductExtracted?.(product);
        onChange({ type: "url", url: trimmed });
        setExtractState({ status: "idle" });
      } else if (res.status >= 400 && res.status < 500) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        const msg =
          body?.message ??
          "Could not extract product details from this URL. Try uploading a photo instead.";
        setExtractState({ status: "error", message: msg });
      } else {
        setExtractState({
          status: "error",
          message: "Extraction failed — try again or upload directly.",
        });
      }
    } catch {
      setExtractState({
        status: "error",
        message: "Network error — check your connection and try again.",
      });
    }
  };

  const isLoading = extractState.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/product"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
            if (extractState.status === "error") {
              setExtractState({ status: "idle" });
            }
          }}
          disabled={isLoading}
          aria-label="Product URL"
          aria-invalid={
            error || extractState.status === "error" ? "true" : undefined
          }
          aria-describedby={
            error || extractState.status === "error" ? "url-error" : undefined
          }
          className="flex-1"
        />
        <Button type="submit" size="default" disabled={isLoading}>
          {isLoading ? "Extracting…" : "Use URL"}
        </Button>
      </div>

      {error ? (
        <p
          id="url-error"
          className="text-caption text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : extractState.status === "error" ? (
        <p
          id="url-error"
          className="text-caption text-destructive"
          role="alert"
        >
          {extractState.message}
        </p>
      ) : (
        <p className="text-caption">
          We'll extract product details automatically.
        </p>
      )}
    </form>
  );
}
