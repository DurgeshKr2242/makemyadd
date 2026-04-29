import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="spotlight-card relative bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-lg">
      <div className="mb-7">
        <p className="text-label mb-3">Welcome back</p>
        <h1 className="text-h1">
          Sign in to <span className="text-serif text-primary">AdCreator</span>
        </h1>
        <p className="text-body-sm text-muted-foreground mt-3">
          Pick up where you left off.
        </p>
      </div>

      <Button variant="outline" className="w-full" disabled>
        <GoogleIcon /> Continue with Google
      </Button>

      <div className="relative my-6">
        <div className="hairline" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-3 text-caption">
          or
        </span>
      </div>

      <form className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot"
              className="text-caption hover:text-foreground transition-colors duration-fast"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled>
          Sign in
        </Button>
      </form>

      <p className="text-caption text-center mt-7">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="text-foreground hover:text-primary transition-colors duration-fast underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" role="img" aria-label="Google">
      <title>Google</title>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.2 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.2 29 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5 0 9.5-1.9 12.9-5.1l-6-5c-1.9 1.4-4.3 2.1-6.9 2.1-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39.7 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6 5C40.8 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
