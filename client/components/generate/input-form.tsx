"use client";

import { Globe, ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { UrlPane } from "@/components/generate/url-pane";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type InputValue =
  | { type: "url"; url: string }
  | { type: "file"; file: File; previewUrl: string }
  | { type: "empty" };

export interface InputFormProps {
  value: InputValue;
  onChange: (v: InputValue) => void;
  onProductExtracted?: (product: ExtractResponse) => void;
  className?: string;
}

// ─── URL Validator ───────────────────────────────────────────────────────────

const PRIVATE_IP_RE =
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fd00:|fe80:)/i;

/**
 * Returns null when the URL is acceptable, or an error string when rejected.
 * Exported so it can be tested in isolation (Feature 1 spec).
 */
export function isAcceptableProductUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Enter a valid URL (e.g. https://example.com/product)";
  }

  if (url.protocol !== "https:") {
    return "URL must start with https://";
  }

  const host = url.hostname.toLowerCase();

  // Block localhost
  if (host === "localhost") {
    return "Localhost URLs are not accepted";
  }

  // Block IP literals (numeric IPv4 or bracketed IPv6)
  const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6BracketRe = /^\[.+]$/;
  if (ipv4Re.test(host) || ipv6BracketRe.test(host)) {
    return "IP address URLs are not accepted";
  }

  // Block private ranges by prefix (catches 127.x.x.x etc via regex)
  if (PRIVATE_IP_RE.test(host)) {
    return "Private or link-local addresses are not accepted";
  }

  // Block cloud metadata endpoint
  if (host === "169.254.169.254") {
    return "This address is not accepted";
  }

  return null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMimeType = (typeof ACCEPTED_TYPES)[number];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function isAcceptedType(mimeType: string): mimeType is AcceptedMimeType {
  return (ACCEPTED_TYPES as readonly string[]).includes(mimeType);
}

// ─── Upload Pane ─────────────────────────────────────────────────────────────

function UploadPane({
  value,
  onChange,
}: {
  value: InputValue;
  onChange: (v: InputValue) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke previous object URL to avoid memory leaks
  const prevPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevPreviewUrl.current) {
        URL.revokeObjectURL(prevPreviewUrl.current);
      }
    };
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!isAcceptedType(file.type)) {
        setError("Only JPG, PNG, and WEBP images are accepted");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("File must be 10 MB or smaller");
        return;
      }

      // Revoke previous URL before creating new one
      if (prevPreviewUrl.current) {
        URL.revokeObjectURL(prevPreviewUrl.current);
      }
      const previewUrl = URL.createObjectURL(file);
      prevPreviewUrl.current = previewUrl;

      onChange({ type: "file", file, previewUrl });
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // "Selected" card — shown when a file has been chosen
  if (value.type === "file") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        {/* Thumbnail */}
        <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
          {/* biome-ignore lint/performance/noImgElement: blob URLs from URL.createObjectURL() are not compatible with next/image */}
          <img
            src={value.previewUrl}
            alt={value.file.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium truncate">{value.file.name}</p>
          <p className="text-caption mt-0.5">
            {(value.file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
            {value.file.type.split("/")[1]?.toUpperCase()}
          </p>
        </div>

        {/* Clear */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove file"
          onClick={() => {
            if (prevPreviewUrl.current) {
              URL.revokeObjectURL(prevPreviewUrl.current);
              prevPreviewUrl.current = null;
            }
            onChange({ type: "empty" });
          }}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    );
  }

  // Dropzone
  return (
    <div>
      <label
        htmlFor={inputId}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-3",
          "rounded-xl border border-dashed p-10 cursor-pointer",
          "transition-colors duration-fast",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-input hover:bg-accent/40",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ImageIcon
          className={cn(
            "h-8 w-8 transition-colors duration-fast",
            isDragOver ? "text-primary" : "text-muted-foreground",
          )}
          strokeWidth={1.25}
        />

        <div className="space-y-1">
          <p className="text-body-sm">
            {isDragOver ? "Drop it here" : "Drop a photo or click to browse"}
          </p>
          <p className="text-caption">JPG, PNG, WEBP · up to 10 MB</p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={(e) => {
            // Prevent label's default that would double-fire
            e.preventDefault();
            inputRef.current?.click();
          }}
          tabIndex={-1}
          aria-hidden
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Choose file
        </Button>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Upload product image"
        />
      </label>

      {error ? (
        <p className="text-caption text-destructive mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── InputForm ───────────────────────────────────────────────────────────────

export function InputForm({
  value,
  onChange,
  onProductExtracted,
  className,
}: InputFormProps) {
  return (
    <Tabs defaultValue="upload" className={cn("w-full", className)}>
      <TabsList className="w-full">
        <TabsTrigger value="upload" className="flex-1 gap-1.5">
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Upload
        </TabsTrigger>
        <TabsTrigger value="url" className="flex-1 gap-1.5">
          <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
          URL
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <UploadPane value={value} onChange={onChange} />
      </TabsContent>

      <TabsContent value="url" className="mt-4">
        <UrlPane
          value={value}
          onChange={onChange}
          onProductExtracted={onProductExtracted}
        />
      </TabsContent>
    </Tabs>
  );
}
