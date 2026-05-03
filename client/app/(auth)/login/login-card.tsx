"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/lib/auth/actions";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { fadeUpHero } from "@/lib/motion/entrance";
import { type SignInInput, signInSchema } from "@/lib/schemas/auth";

export function LoginCard() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeRedirect(params.get("next"));
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: SignInInput) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", values.email);
      fd.set("password", values.password);
      const result = await signInAction(fd);
      if (result.ok) {
        toast.success("Welcome back");
        router.replace(next);
        router.refresh();
        return;
      }
      if (result.field === "email" || result.field === "password") {
        setError(result.field, { message: result.error });
        return;
      }
      toast.error(result.error);
    });
  };

  return (
    <motion.div
      className="spotlight-card relative bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-lg"
      initial={reducedMotion ? false : "hidden"}
      animate="show"
      variants={fadeUpHero}
    >
      <div className="mb-7">
        <p className="text-label mb-3">Welcome back</p>
        <h1 className="text-h1">
          Sign in to <span className="text-serif text-primary">AdCreator</span>
        </h1>
        <p className="text-body-sm text-muted-foreground mt-3">
          Pick up where you left off.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@brand.in"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-caption text-destructive mt-1">
              {errors.email.message}
            </p>
          ) : null}
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
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-caption text-destructive mt-1">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
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
    </motion.div>
  );
}
