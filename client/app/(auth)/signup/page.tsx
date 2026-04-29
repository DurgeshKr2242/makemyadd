import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <div className="spotlight-card relative bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-lg">
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

        <div className="rounded-lg border border-dashed border-border bg-background/50 px-3 py-2.5 text-caption">
          Bot check appears here once Turnstile keys are set.
        </div>

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
    </div>
  );
}
