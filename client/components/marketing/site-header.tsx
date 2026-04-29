import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/pricing", label: "Pricing" },
  { href: "/templates", label: "Templates" },
  { href: "/design", label: "Design" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-medium tracking-tight"
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-fast group-hover:scale-105">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="text-[0.95rem]">AdCreator</span>
          <span className="hidden sm:inline-flex items-center gap-1 ml-1 text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
            in
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-md text-body-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-fast"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/login">Sign in</Link>}
          />
          <Button
            size="sm"
            render={
              <Link href="/signup" className="group">
                Get started{" "}
                <ArrowUpRight
                  className="ml-0.5 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={2}
                />
              </Link>
            }
          />
        </div>
      </div>
    </header>
  );
}
