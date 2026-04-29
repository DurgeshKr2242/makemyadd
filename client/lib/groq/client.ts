/**
 * Groq client wrapper — TODO §8.
 *
 * Stub. Real implementation lands when `/api/generate/copy` is wired (§8.3).
 * Imports `groq-sdk` lazily so the package isn't loaded in routes that
 * don't need it.
 */
import "server-only";

import { z } from "zod";

import { requireServerEnv } from "@/lib/env.server";

export const CopyVariantSchema = z.object({
  headline: z.string().max(60),
  subheadline: z.string().max(120),
  cta: z.string().max(30),
});

export const CopyOutputSchema = z.object({
  variants: z.array(CopyVariantSchema).length(3),
});

export type CopyVariant = z.infer<typeof CopyVariantSchema>;
export type CopyOutput = z.infer<typeof CopyOutputSchema>;

let cachedClient: unknown = null;

export async function getGroqClient() {
  if (cachedClient) return cachedClient;
  const apiKey = requireServerEnv("GROQ_API_KEY");
  const { default: Groq } = await import("groq-sdk");
  cachedClient = new Groq({ apiKey });
  return cachedClient as InstanceType<typeof Groq>;
}
