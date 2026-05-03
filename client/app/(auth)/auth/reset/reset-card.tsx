"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/lib/auth/actions";
import { type ResetInput, resetSchema } from "@/lib/schemas/auth";

export function ResetCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const password = watch("password");

  const onSubmit = (values: ResetInput) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("password", values.password);
      fd.set("confirm", values.confirm);
      const result = await resetPasswordAction(fd);
      if (result.ok) {
        toast.success("Password updated");
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      if (result.field === "password" || result.field === "confirm") {
        setError(result.field, { message: result.error });
        return;
      }
      toast.error(result.error);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h2">Set a new password</CardTitle>
        <CardDescription>
          Pick something at least 8 characters long.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
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
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm)}
              {...register("confirm")}
            />
            {errors.confirm ? (
              <p className="text-caption text-destructive mt-1">
                {errors.confirm.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
