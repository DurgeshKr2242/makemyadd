/**
 * Groq Vision wrapper — describe a product photo as JSON.
 *
 * Retries up to 3× with a temperature ramp (0.2 → 0.4 → 0.6) so the first
 * attempt is deterministic and later attempts have more flexibility for
 * awkward images. Validates the JSON against a Zod schema; bad JSON or
 * schema mismatch counts as a failed attempt.
 *
 * Caller maps `VisionError` to a 422 `vision_failed` response which opens
 * the ManualEntryDialog with the image preview pre-filled.
 */
import "server-only";

import { z } from "zod";

import { requireServerEnv, serverEnv } from "@/lib/env.server";
import { CATEGORIES } from "@/lib/types";

const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const VisionResultSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  category: z.enum(CATEGORIES).optional(),
});
export type VisionResult = z.infer<typeof VisionResultSchema>;

export class VisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionError";
  }
}

const PROMPT = `You are a product-image describer for an ad-creation tool.
Identify the product in the image. Return ONLY a JSON object with these keys:
- name: ≤80 chars, English
- description: ≤500 chars, English; mention material, use, audience
- category: one of: ${CATEGORIES.join(", ")}
No prose around the JSON.`;

export async function describeProductImage(
  imageUrl: string,
): Promise<VisionResult> {
  const apiKey = requireServerEnv("GROQ_API_KEY");
  const model = serverEnv.GROQ_VISION_MODEL ?? DEFAULT_MODEL;

  const { default: Groq } = await import("groq-sdk");
  const client = new Groq({ apiKey });

  const temperatures = [0.2, 0.4, 0.6];
  let lastError = "no attempts";

  for (let i = 0; i < temperatures.length; i++) {
    try {
      const res = await client.chat.completions.create({
        model,
        temperature: temperatures[i],
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      });
      const content = res.choices[0]?.message?.content ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        lastError = `json_parse:${(err as Error).message}`;
        continue;
      }
      const result = VisionResultSchema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = `schema:${result.error.issues[0]?.message ?? "invalid"}`;
    } catch (err) {
      lastError = `api:${(err as Error).message}`;
    }
  }
  throw new VisionError(
    `vision_failed_after_${temperatures.length}_attempts:${lastError}`,
  );
}
