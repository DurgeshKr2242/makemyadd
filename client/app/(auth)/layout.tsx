import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 flex flex-col isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 gradient-aurora pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 grid-fade pointer-events-none opacity-50"
      />

      <header className="px-6 lg:px-8 h-14 flex items-center">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-medium tracking-tight"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="text-[0.95rem]">AdCreator</span>
        </Link>
      </header>

      <main
        id="main"
        className="flex-1 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-6 lg:px-8 py-6 text-caption text-center">
        © 2026 AdCreator ·{" "}
        <Link
          href="/legal/privacy"
          className="hover:text-foreground transition-colors duration-fast"
        >
          Privacy
        </Link>
        {" · "}
        <Link
          href="/legal/terms"
          className="hover:text-foreground transition-colors duration-fast"
        >
          Terms
        </Link>
      </footer>
    </div>
  );
}
