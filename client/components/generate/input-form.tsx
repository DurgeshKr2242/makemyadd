"use client";

import { Globe, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { UrlPane } from "@/components/generate/url-pane";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractResponse } from "@/lib/schemas/generation";
import { cn } from "@/lib/utils";

/** Hint passed to the manual-entry-dialog (defined in `./manual-entry-dialog`)
 *  when scrape/vision fails. We declare the shape here so input-form.tsx
 *  doesn't take a hard dep on the dialog component. */
export type ManualEntryHint = {
  source: "url" | "photo" | "user";
  urlIfAny?: string;
  imageUrlIfAny?: string;
  defaultName?: string;
  defaultDesc?: string;
};

// ─── Types ──────────────────────────────────────────────────────────────────

export type InputValue =
  | { type: "url"; url: string }
  | { type: "file"; file: File; previewUrl: string }
  | {
      type: "uploaded";
      file: File;
      previewUrl: string;
      key: string;
      publicUrl: string;
    }
  | { type: "empty" };

export interface InputFormProps {
  value: InputValue;
  onChange: (v: InputValue) => void;
  onProductExtracted?: (product: ExtractResponse) => void;
  /** Open the manual-entry fallback dialog from inside any pane. */
  onRequestManualEntry?: (hint: ManualEntryHint) => void;
  className?: string;
}

// ─── URL Validator (client-side preflight; server has its own DNS guard) ────

const PRIVATE_IP_RE =
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fd00:|fe80:)/i;

export function isAcceptableProductUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Enter a valid URL (e.g. https://example.com/product)";
  }
  if (url.protocol !== "https:") return "URL must start with https://";
  const host = url.hostname.toLowerCase();
  if (host === "localhost") return "Localhost URLs are not accepted";
  const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6BracketRe = /^\[.+]$/;
  if (ipv4Re.test(host) || ipv6BracketRe.test(host)) {
    return "IP address URLs are not accepted";
  }
  if (PRIVATE_IP_RE.test(host))
    return "Private or link-local addresses are not accepted";
  if (host === "169.254.169.254") return "This address is not accepted";
  return null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMimeType = (typeof ACCEPTED_TYPES)[number];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function isAcceptedType(mimeType: string): mimeType is AcceptedMimeType {
  return (ACCEPTED_TYPES as readonly string[]).includes(mimeType);
}

// ─── Upload helper ──────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "error"; message: string };

/** Upload a file via the presign route + a progress-aware XHR PUT. fetch
 *  doesn't expose upload progress, so we use XHR — `upload.onprogress`
 *  drives the progress bar. */
async function presignAndUpload(
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<{ key: string; publicUrl: string } | { error: string }> {
  const presign = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
    signal,
  });
  if (!presign.ok) {
    const body = (await presign.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;
    return {
      error:
        body?.message ??
        body?.error ??
        `Upload setup failed (${presign.status})`,
    };
  }
  const { presignedUrl, key, publicUrl } = (await presign.json()) as {
    presignedUrl: string;
    key: string;
    publicUrl: string;
  };

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ key, publicUrl });
      } else {
        resolve({ error: `Upload failed (${xhr.status})` });
      }
    };
    xhr.onerror = () => resolve({ error: "Network error during upload" });
    xhr.onabort = () => resolve({ error: "Upload cancelled" });
    if (signal) signal.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
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
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });

  const prevPreviewUrl = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!isAcceptedType(file.type)) {
        setError("Only JPG, PNG, and WEBP images are accepted");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("File must be 10 MB or smaller");
        return;
      }

      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
      const previewUrl = URL.createObjectURL(file);
      prevPreviewUrl.current = previewUrl;
      onChange({ type: "file", file, previewUrl });

      setUpload({ status: "uploading", progress: 0 });
      const result = await presignAndUpload(file, (pct) => {
        setUpload({ status: "uploading", progress: pct });
      });
      if ("error" in result) {
        setUpload({ status: "error", message: result.error });
        return;
      }
      setUpload({ status: "idle" });
      onChange({
        type: "uploaded",
        file,
        previewUrl,
        key: result.key,
        publicUrl: result.publicUrl,
      });
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
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

  // Selected card — file picked or fully uploaded
  if (value.type === "file" || value.type === "uploaded") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 relative overflow-hidden">
        <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
          {/* biome-ignore lint/performance/noImgElement: blob URLs from URL.createObjectURL() are not compatible with next/image */}
          <img
            src={value.previewUrl}
            alt={value.file.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium truncate">{value.file.name}</p>
          <p className="text-caption mt-0.5">
            {(value.file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
            {value.file.type.split("/")[1]?.toUpperCase()}
            {value.type === "uploaded" ? " · Uploaded" : null}
          </p>
        </div>
        {upload.status === "uploading" ? (
          <span className="text-caption text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {upload.progress}%
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove file"
            onClick={() => {
              if (prevPreviewUrl.current) {
                URL.revokeObjectURL(prevPreviewUrl.current);
                prevPreviewUrl.current = null;
              }
              setUpload({ status: "idle" });
              onChange({ type: "empty" });
            }}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        )}
        {upload.status === "uploading" ? (
          <span
            className="absolute left-0 bottom-0 h-0.5 bg-primary transition-all duration-fast"
            style={{ width: `${upload.progress}%` }}
            aria-hidden
          />
        ) : null}
        {upload.status === "error" ? (
          <p
            className="absolute left-4 bottom-1 text-caption text-destructive"
            role="alert"
          >
            {upload.message}
          </p>
        ) : null}
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
  onRequestManualEntry,
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
          onRequestManualEntry={onRequestManualEntry}
        />
      </TabsContent>
    </Tabs>
  );
}
