import type { Metadata } from "next";

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

export const metadata: Metadata = {
  title: "Set new password",
};

export default function ResetPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h2">Set a new password</CardTitle>
        <CardDescription>
          Pick something at least 8 characters long.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
