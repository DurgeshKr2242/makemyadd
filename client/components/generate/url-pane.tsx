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
  onRequestManualEntry?: (hint: ManualEntryHint) => void;
}

type ExtractState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

const FALLBACK_CODES = new Set(["no_metadata", "login_wall", "vision_failed"]);

export function UrlPane({
  value,
  onChange,
  onProductExtracted,
  onRequestManualEntry,
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
        onProductExtracted?.(product);
        onChange({ type: "url", url: trimmed });
        setExtractState({ status: "idle" });
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (body?.error && FALLBACK_CODES.has(body.error)) {
        // Open the manual-entry dialog with a useful hint.
        onRequestManualEntry?.({ source: "url", urlIfAny: trimmed });
        setExtractState({ status: "idle" });
        return;
      }

      const msg =
        body?.message ??
        "Could not extract product details from this URL. Try uploading a photo instead.";
      setExtractState({ status: "error", message: msg });
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
          We'll extract product details automatically.{" "}
          <button
            type="button"
            className="underline-offset-2 hover:underline text-foreground"
            onClick={() => onRequestManualEntry?.({ source: "user" })}
          >
            Enter details manually
          </button>
          .
        </p>
      )}
    </form>
  );
}
