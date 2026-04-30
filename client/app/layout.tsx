import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { CommandPalette } from "@/components/command/command-palette";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Editorial accent — used SPARINGLY (one moment per page).
// See client/DESIGN.md § Typography.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AdCreator — AI ads for Indian small businesses",
    template: "%s · AdCreator",
  },
  description:
    "Generate professional ad creatives in Hindi, Tamil, Telugu, and English in under 30 seconds.",
  applicationName: "AdCreator",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://adcreator.in",
  ),
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a10" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans antialiased flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <TooltipProvider delay={150}>
          {children}
          <CommandPalette />
        </TooltipProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "border-border bg-card text-card-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
