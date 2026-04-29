/**
 * Server-only env vars.
 *
 * The `import "server-only"` line makes Next.js refuse to bundle this module
 * into a Client Component. If you see "You're importing a component that
 * needs server-only", check your import — likely a Client Component reaching
 * for `serverEnv.SOMETHING`. Use `publicEnv` for browser code.
 *
 * For now most server vars are optional so a fresh checkout boots in dev
 * without every integration plugged in. They become required as we wire each
 * feature (Razorpay webhook secret tightens once §12 lands, etc.).
 *
 * See TODO §20.
 */
import "server-only";
import { z } from "zod";

const ServerEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI providers
  GROQ_API_KEY: z.string().min(1).optional(),
  HUGGINGFACE_TOKEN: z.string().min(1).optional(),

  // Cloudflare R2
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_PUBLIC_BASE: z.string().url().optional(),
  R2_BUCKET_UPLOADS: z.string().min(1).default("adcreator-uploads"),
  R2_BUCKET_PROCESSED: z.string().min(1).default("adcreator-processed"),
  R2_BUCKET_PUBLIC: z.string().min(1).default("adcreator-public"),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  RAZORPAY_PLAN_STARTER: z.string().min(1).optional(),
  RAZORPAY_PLAN_PRO: z.string().min(1).optional(),
  RAZORPAY_PLAN_AGENCY: z.string().min(1).optional(),
  RAZORPAY_PLAN_STARTER_ANNUAL: z.string().min(1).optional(),
  RAZORPAY_PLAN_PRO_ANNUAL: z.string().min(1).optional(),
  RAZORPAY_PLAN_AGENCY_ANNUAL: z.string().min(1).optional(),

  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

  // Email
  RESEND_API_KEY: z.string().min(1).optional(),

  // Errors
  SENTRY_DSN: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),

  // Node
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

const parsed = ServerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid server environment variables:\n" +
      Object.entries(parsed.error.flatten().fieldErrors)
        .map(([k, v]) => `  ${k}: ${v?.join(", ")}`)
        .join("\n"),
  );
  throw new Error("Invalid server environment variables");
}

export const serverEnv: ServerEnv = parsed.data;

/** Helper: a server-only check that a given var is set. Throws with a
 *  consistent message so the caller can rely on a non-null value below. */
export function requireServerEnv<K extends keyof ServerEnv>(
  key: K,
): NonNullable<ServerEnv[K]> {
  const value = serverEnv[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing required server env var: ${key}. Set it in .env.local (or Vercel project settings).`,
    );
  }
  return value as NonNullable<ServerEnv[K]>;
}
