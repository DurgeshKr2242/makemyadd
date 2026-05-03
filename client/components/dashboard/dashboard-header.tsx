"use client";

import { Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { openCommandPalette } from "@/components/command/command-palette";
import { UsageBadge } from "@/components/dashboard/usage-badge";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Studio" },
  { href: "/history", label: "History" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export function DashboardHeader({
  email,
  fullName,
  plan,
}: {
  email?: string;
  fullName?: string | null;
  plan?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="hidden sm:inline text-[0.95rem]">AdCreator</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3 py-1.5 rounded-md text-body-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute left-3 right-3 -bottom-[7px] h-0.5 bg-primary rounded-full"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Open command palette"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            <kbd className="hidden lg:inline font-mono text-[10px] tracking-wider border border-border rounded px-1 py-0.5 bg-muted">
              ⌘K
            </kbd>
          </button>

          <UsageBadge />

          {pathname !== "/dashboard" ? (
            <ButtonLink
              href="/dashboard"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              New ad
            </ButtonLink>
          ) : null}

          <UserMenu email={email} fullName={fullName} plan={plan} />
        </div>
      </div>
    </header>
  );
}
