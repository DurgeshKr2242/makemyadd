"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordStrength } from "@/components/auth/password-strength";
import { TurnstileGate } from "@/components/auth/turnstile-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction } from "@/lib/auth/actions";
import { fadeUpHero } from "@/lib/motion/entrance";
import { type SignUpInput, signUpSchema } from "@/lib/schemas/auth";

export function SignupCard() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      turnstileToken: "",
    },
  });
  const password = watch("password");

  const onSubmit = (values: SignUpInput) => {
    if (!turnstileToken) {
      setError("turnstileToken", { message: "Please complete the captcha" });
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("fullName", values.fullName);
      fd.set("email", values.email);
      fd.set("password", values.password);
      fd.set("turnstileToken", turnstileToken);
      const result = await signUpAction(fd);
      if (result.ok) {
        toast.success("Welcome — let's create your first ad");
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      if (
        result.field === "email" ||
        result.field === "password" ||
        result.field === "fullName"
      ) {
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
        <p className="text-label mb-3">Get started</p>
        <h1 className="text-h1">
          Create your <span className="text-serif text-primary">account.</span>
        </h1>
        <p className="text-body-sm text-muted-foreground mt-3">
          Five free generations on us. No card required.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Sundar Devi"
            aria-invalid={Boolean(errors.fullName)}
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="text-caption text-destructive mt-1">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <PasswordStrength password={password ?? ""} />
          {errors.password ? (
            <p className="text-caption text-destructive mt-1">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <TurnstileGate
          onVerified={(t) => {
            setTurnstileToken(t);
            setValue("turnstileToken", t ?? "", { shouldValidate: false });
          }}
        />
        {errors.turnstileToken ? (
          <p className="text-caption text-destructive">
            {errors.turnstileToken.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
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
