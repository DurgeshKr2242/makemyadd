import type { Metadata } from "next";
import Link from "next/link";

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

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h2">Reset your password</CardTitle>
        <CardDescription>
          We'll send a reset link to your email. The link is valid for 1 hour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@brand.in"
            />
          </div>
          <Button type="submit" className="w-full" disabled>
            Send reset link
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
