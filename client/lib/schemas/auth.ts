/**
 * Zod schemas shared by the auth client forms (RHF resolver) and the server
 * actions (defense-in-depth re-parse). Mirrors the password policy enforced
 * by Supabase Auth — see TODO §3.1.
 */
import { z } from "zod";

const PASSWORD = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[0-9]/, "Include a number")
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/, "Include a symbol");

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

export const signUpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  fullName: z.string().min(1, "Required").max(80, "Keep it short"),
  password: PASSWORD,
  turnstileToken: z.string().min(1, "Captcha required"),
});

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetSchema = z
  .object({
    password: PASSWORD,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
