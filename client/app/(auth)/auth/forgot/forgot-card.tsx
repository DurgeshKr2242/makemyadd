"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { type ForgotInput, forgotSchema } from "@/lib/schemas/auth";

export function ForgotCard() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotInput) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", values.email);
      await forgotPasswordAction(fd);
      // Always show success — the action returns ok regardless of whether the
      // address corresponds to an account (no enumeration).
      toast.success("If an account exists, we've sent a reset link.");
      reset();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h2">Reset your password</CardTitle>
        <CardDescription>
          We&apos;ll email you a link valid for 1 hour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : isSubmitSuccessful ? (
              "Email sent"
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-caption">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
