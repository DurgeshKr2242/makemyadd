"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";

export function UserMenu({
  email,
  fullName,
  plan,
}: {
  email?: string;
  fullName?: string | null;
  plan?: string | null;
}) {
  const display = fullName?.trim() || email || "Account";
  const triggerLabel = display.split(" ")[0] ?? "Account";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            {triggerLabel} <ChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-body-sm">{display}</span>
            {email && fullName ? (
              <span className="text-caption text-muted-foreground">
                {email}
              </span>
            ) : null}
            {plan ? (
              <span className="text-caption text-primary capitalize mt-1">
                {plan} plan
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings">Settings</Link>} />
        <DropdownMenuItem render={<Link href="/billing">Billing</Link>} />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <form action={signOutAction}>
              <button type="submit" className="w-full text-left cursor-default">
                Sign out
              </button>
            </form>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
