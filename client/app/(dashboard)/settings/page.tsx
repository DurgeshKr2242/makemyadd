import { Trash2 } from "lucide-react";
import type { Metadata } from "next";

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
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      <div>
        <h1 className="text-h1">Settings</h1>
        <p className="text-body text-muted-foreground mt-2">
          Profile, security, and account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Profile</CardTitle>
          <CardDescription>Your name appears in invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Sundar Devi" />
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled>Save changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Email</CardTitle>
          <CardDescription>Used for sign-in and receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Password</CardTitle>
          <CardDescription>
            Pick something at least 8 characters long.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" autoComplete="new-password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled>Update password</Button>
        </CardFooter>
      </Card>

      <Separator />

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-h3">Delete account</CardTitle>
          <CardDescription>
            Permanently removes your data within 30 days, in line with the DPDP
            Act.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" disabled>
            <Trash2 /> Delete my account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
