/**
 * Zod schemas shared between API route input/output and the client form.
 *
 * Keep both sides referencing the same module so a server contract change
 * shows up as a TypeScript error in the form.
 *
 * See TODO §11 (API routes) and §8 (copy generation).
 */
import { z } from "zod";

import {
  CATEGORIES,
  FORMATS,
  INPUT_TYPES,
  LANGUAGES,
  TONES,
} from "@/lib/types";

export const PresignRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 10 MB
});
export type PresignRequest = z.infer<typeof PresignRequestSchema>;

export const PresignResponseSchema = z.object({
  presignedUrl: z.string().url(),
  key: z.string().min(1),
  publicUrl: z.string().url(),
});
export type PresignResponse = z.infer<typeof PresignResponseSchema>;

export const ExtractRequestSchema = z.discriminatedUnion("inputType", [
  z.object({
    inputType: z.literal("url"),
    inputUrl: z.string().url(),
  }),
  z.object({
    inputType: z.literal("photo"),
    imageKey: z.string().min(1),
  }),
]);
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const ExtractResponseSchema = z.object({
  productName: z.string().min(1).max(200),
  productDesc: z.string().max(2000),
  productImageUrl: z.string().url(),
  category: z.enum(CATEGORIES).optional(),
  brand: z.string().max(80).optional(),
  price: z
    .object({
      amount: z.number().positive(),
      currency: z.string().length(3),
    })
    .optional(),
});
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;

export const BgRemoveRequestSchema = z.object({
  imageUrl: z.string().url(),
});
export type BgRemoveRequest = z.infer<typeof BgRemoveRequestSchema>;

export const BgRemoveResponseSchema = z.object({
  bgRemovedUrl: z.string().url(),
  fromCache: z.boolean(),
});
export type BgRemoveResponse = z.infer<typeof BgRemoveResponseSchema>;

export const CopyRequestSchema = z.object({
  productName: z.string().min(1).max(200),
  productDesc: z.string().max(2000),
  language: z.enum(LANGUAGES),
  tone: z.enum(TONES),
  format: z.enum(FORMATS),
  category: z.enum(CATEGORIES),
  turnstileToken: z.string().min(1).optional(),
});
export type CopyRequest = z.infer<typeof CopyRequestSchema>;

export const CopyVariantSchema = z.object({
  headline: z.string().max(60),
  subheadline: z.string().max(120),
  cta: z.string().max(30),
});
export const CopyResponseSchema = z.object({
  variants: z.array(CopyVariantSchema).length(3),
});
export type CopyResponse = z.infer<typeof CopyResponseSchema>;

export const InputTypeSchema = z.enum(INPUT_TYPES);
