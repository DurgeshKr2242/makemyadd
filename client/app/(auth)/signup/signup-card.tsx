"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { TurnstileGate } from "@/components/auth/turnstile-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fadeUpHero } from "@/lib/motion/entrance";

export function SignupCard() {
  const reducedMotion = useReducedMotion();
  // TODO §13 — pass _turnstileToken to the Supabase auth submit handler once wired.
  // Prefixed with _ because the read side is intentional infrastructure (collected but not yet consumed).
  const [_turnstileToken, setTurnstileToken] = useState<string | null>(null);

  return (
    <motion.div
      className="spotlight-card relative bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-lg"
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      variants={fadeUpHero}
    >
      <div className="mb-7">
        <p className="text-label mb-3">Get started</p>
        <h1 className="text-h1">
          Create your <span className="text-serif text-primary">account.</span>
        </h1>
        <p className="text-body-sm text-muted-foreground mt-3">
          Five free generations on us. No card required.
        </p>
      </div>

      <Button variant="outline" className="w-full" disabled>
        Continue with Google
      </Button>

      <div className="relative my-6">
        <div className="hairline" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-3 text-caption">
          or
        </span>
      </div>

      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" autoComplete="name" placeholder="Sundar Devi" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@brand.in"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>

        <TurnstileGate onVerified={setTurnstileToken} />

        <Button type="submit" className="w-full" disabled>
          Create account
        </Button>

        <p className="text-caption">
          By signing up, you agree to our{" "}
          <Link
            href="/legal/terms"
            className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="text-caption text-center mt-7">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
