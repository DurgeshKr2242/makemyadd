"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Download,
  Eye,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// Components we're showcasing
import { CopyVariants } from "@/components/generate/copy-variants";
import {
  type ProgressStep,
  ProgressStepper,
} from "@/components/generate/progress-stepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Static data ──────────────────────────────────────────────────────────────

const COLOR_TOKENS = [
  { name: "background", className: "bg-background", border: true },
  { name: "foreground", className: "bg-foreground", textOn: "text-background" },
  { name: "card", className: "bg-card", border: true },
  { name: "popover", className: "bg-popover", border: true },
  {
    name: "primary",
    className: "bg-primary",
    textOn: "text-primary-foreground",
  },
  { name: "secondary", className: "bg-secondary" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  {
    name: "destructive",
    className: "bg-destructive",
    textOn: "text-destructive-foreground",
  },
  { name: "border", className: "bg-border", border: true },
  { name: "ring", className: "bg-ring" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "info", className: "bg-info" },
];

const BRAND_TOKENS = [
  { name: "brand-saffron", className: "bg-brand-saffron" },
  { name: "brand-marigold", className: "bg-brand-marigold" },
  { name: "brand-indigo", className: "bg-brand-indigo" },
];

const TYPOGRAPHY_SAMPLES = [
  {
    className: "text-display",
    label: "Display · Geist · clamp(44–72px) · 500",
    text: "Make ads people stop scrolling for.",
  },
  {
    className: "text-h1",
    label: "Heading 1 · Geist · 36/44 · 500 · −0.025em",
    text: "Your festival sale, ready in 30 seconds",
  },
  {
    className: "text-h2",
    label: "Heading 2 · Geist · 28/36 · 500 · −0.02em",
    text: "Generate. Preview. Download.",
  },
  {
    className: "text-h3",
    label: "Heading 3 · Geist · 18/26 · 500 · −0.015em",
    text: "Three variants, one tap",
  },
  {
    className: "text-body",
    label: "Body · Geist · 15/28 · 400",
    text: "Drop a product photo or paste a URL — we extract the details, remove the background, and generate copy in your language.",
  },
  {
    className: "text-body-sm",
    label: "Body small · Geist · 13/20 · 400",
    text: "Used in tables, secondary descriptions, and dense lists.",
  },
  {
    className: "text-caption",
    label: "Caption · Geist · 12/16 · 400 muted",
    text: "Helper text and subtle metadata.",
  },
  {
    className: "text-label",
    label: "Label · Geist · 11/14 · 500 caps · +0.16em",
    text: "Section eyebrow",
  },
  {
    className: "text-mono",
    label: "Mono · Geist Mono · 12/18",
    text: "gen-0xf3a2 · 1×1 · hi",
  },
];

const INDIC_SAMPLES = [
  { lang: "en", text: "New offer — buy today and save 20%." },
  { lang: "hi", text: "नया ऑफर — आज ही खरीदें और 20% बचाएँ।" },
  { lang: "ta", text: "புதிய சலுகை — இன்றே வாங்கி 20% சேமியுங்கள்." },
  { lang: "te", text: "కొత్త ఆఫర్ — ఈరోజే కొనండి, 20% ఆదా చేయండి." },
];

const ATMOSPHERE_TILES = [
  {
    name: ".gradient-spotlight",
    className: "gradient-spotlight",
    desc: "Default hero. Single saffron radial at 78% −10%.",
  },
  {
    name: ".gradient-aurora",
    className: "gradient-aurora",
    desc: "Marketing hero only. Saffron + indigo + marigold.",
  },
  {
    name: ".grid-fade",
    className: "grid-fade",
    desc: "Subtle 56px grid fading to transparent at edges.",
  },
  {
    name: ".grain",
    className: "grain bg-card",
    desc: "4% opacity noise overlay. Hero only.",
  },
  {
    name: ".spotlight-card",
    className: "spotlight-card bg-card border border-border",
    desc: "Top-edge radial highlight (Apple Vision Pro style).",
  },
  {
    name: ".hairline",
    className: "",
    isHairline: true,
    desc: "Gradient hairline — fades to transparent at edges.",
  },
];

const SAMPLE_STEPS: ProgressStep[] = [
  { key: "upload", label: "Upload", status: "done" },
  { key: "extract", label: "Extract", status: "done" },
  { key: "bgremove", label: "BG remove", status: "running" },
  { key: "copy", label: "Copy", status: "pending" },
  { key: "render", label: "Render", status: "pending" },
  { key: "done", label: "Done", status: "pending" },
];

const SAMPLE_VARIANTS = [
  {
    headline: "त्योहारी सेल — आज ही खरीदें",
    subheadline: "हाथ से बुनी हुई कॉटन साड़ी पर 20% की छूट।",
    cta: "अभी खरीदें",
  },
  {
    headline: "तोहफा खुद को दीजिए",
    subheadline: "फेस्टिवल कलेक्शन — सीमित समय के लिए।",
    cta: "देखिए",
  },
  {
    headline: "घर बैठे शॉपिंग",
    subheadline: "फ्री शिपिंग, कैश ऑन डिलीवरी।",
    cta: "ऑर्डर करें",
  },
];

const ALL_BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
] as const;

const ALL_BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;

// ─── Showcase ────────────────────────────────────────────────────────────────

export function DesignShowcase() {
  const [progress, setProgress] = useState(45);
  const [loading, setLoading] = useState(false);
  const [switched, setSwitched] = useState(true);
  const [variantIdx, setVariantIdx] = useState(0);

  return (
    <main
      id="main"
      className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
    >
      {/* Header */}
      <header className="relative mb-16 pb-12 border-b border-border">
        <div
          className="absolute inset-0 -z-10 gradient-spotlight pointer-events-none"
          aria-hidden
        />
        <div className="flex items-center gap-2 text-label mb-6">
          <Palette className="h-3.5 w-3.5" />
          Design system · v0.2
        </div>
        <h1 className="text-display max-w-3xl">
          The visual lock for{" "}
          <span className="text-serif text-primary">AdCreator</span>.
        </h1>
        <p className="text-body text-muted-foreground mt-4 max-w-2xl">
          Every token, typography scale, atmosphere utility, and component state
          lives here. If this page looks wrong, the design system is broken —
          fix it before shipping new UI.
        </p>
        <p className="text-caption mt-6">
          Source:{" "}
          <code className="text-mono bg-muted px-1.5 py-0.5 rounded">
            client/DESIGN.md
          </code>{" "}
          · Tokens:{" "}
          <code className="text-mono bg-muted px-1.5 py-0.5 rounded">
            app/globals.css
          </code>
        </p>
      </header>

      <div className="space-y-20">
        {/* ─── Colors ─── */}
        <section>
          <SectionHeader
            title="Color tokens"
            subtitle="Semantic only — never use raw OKLCH or hex in components"
          />
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {COLOR_TOKENS.map((t) => (
              <div
                key={t.name}
                className={`rounded-lg ${t.className} ${t.border ? "border border-border" : ""} h-24 flex items-end p-3`}
              >
                <span
                  className={`text-mono text-[11px] ${t.textOn ?? "text-foreground"}`}
                >
                  {t.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-label mb-3">Brand-extended (marketing only)</h3>
            <div className="grid gap-3 grid-cols-3 max-w-2xl">
              {BRAND_TOKENS.map((t) => (
                <div
                  key={t.name}
                  className={`rounded-lg ${t.className} h-20 flex items-end p-3`}
                >
                  <span className="text-mono text-[11px] text-background">
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ─── Typography ─── */}
        <section>
          <SectionHeader
            title="Typography"
            subtitle="Geist Sans · use the utility classes, never eyeball font sizes"
          />
          <div className="space-y-6">
            {TYPOGRAPHY_SAMPLES.map((s) => (
              <div
                key={s.className}
                className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-8 items-baseline"
              >
                <div className="text-mono text-caption">{s.label}</div>
                <div className={s.className}>{s.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h3 className="text-label mb-3">
              Indic scripts (HTML — canvas path is separate)
            </h3>
            <Card>
              <CardContent className="space-y-3 pt-6">
                {INDIC_SAMPLES.map((s) => (
                  <div
                    key={s.lang}
                    lang={s.lang}
                    className="text-h3 flex items-baseline gap-3"
                  >
                    <Badge
                      variant="outline"
                      className="font-mono uppercase text-[10px]"
                    >
                      {s.lang}
                    </Badge>
                    <span>{s.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ─── Editorial moments ─── */}
        <section>
          <SectionHeader
            title="Editorial moments"
            subtitle="Instrument Serif — one moment per surface, not sprinkled"
          />

          <div className="space-y-6">
            {/* Display vs Display-Serif comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-label">
                  .text-display vs .text-display-serif
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-caption mb-3">Geist Sans (default hero)</p>
                  <p className="text-display leading-none">Make an ad today.</p>
                </div>
                <div>
                  <p className="text-caption mb-3">
                    Instrument Serif (editorial hero)
                  </p>
                  <p className="text-display-serif leading-none">
                    Make an ad today.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Indic script display comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-label">
                  Indic — display scale, no clipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-caption mb-2">
                  Hindi runs ~25% wider; Tamil ~35%. Never hard-code container
                  widths.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div lang="hi" className="text-h2">
                    त्योहारी सेल — अभी खरीदें
                  </div>
                  <div lang="ta" className="text-h2">
                    திருவிழா சலுகை — இன்றே வாங்கு
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inline serif accent example */}
            <Card>
              <CardHeader>
                <CardTitle className="text-label">
                  Inline .text-serif accent (one per surface)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-h2">
                  Studio-quality ads in{" "}
                  <em className="text-serif text-primary not-italic">
                    your language
                  </em>
                  .
                </p>
                <p className="text-h2">
                  Generate{" "}
                  <span className="text-serif text-primary">3 variants</span> in
                  30 seconds.
                </p>
                <p className="text-h2">
                  Trusted by{" "}
                  <span className="text-serif text-foreground">2,500</span>{" "}
                  sellers.
                </p>
                <p className="text-caption">
                  The serif word is the beat. One per page — used on the heading
                  where it has the most emotional weight.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ─── Atmosphere ─── */}
        <section>
          <SectionHeader
            title="Atmosphere utilities"
            subtitle="Never ship a solid-color hero — use these instead"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ATMOSPHERE_TILES.map((tile) =>
              tile.isHairline ? (
                <div
                  key={tile.name}
                  className="rounded-xl border border-border bg-card flex flex-col overflow-hidden"
                  style={{ height: 120 }}
                >
                  <div className="flex-1 flex items-center px-6">
                    <div className="hairline w-full" />
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-mono text-[11px] text-primary mb-0.5">
                      {tile.name}
                    </p>
                    <p className="text-caption">{tile.desc}</p>
                  </div>
                </div>
              ) : (
                <div
                  key={tile.name}
                  className={`rounded-xl ${tile.className} flex flex-col justify-end p-4 border border-border`}
                  style={{ height: 120 }}
                >
                  <p className="text-mono text-[11px] text-primary mb-0.5">
                    {tile.name}
                  </p>
                  <p className="text-caption">{tile.desc}</p>
                </div>
              ),
            )}
          </div>
        </section>

        <Separator />

        {/* ─── Buttons + ButtonLink ─── */}
        <section>
          <SectionHeader
            title="Buttons + ButtonLink"
            subtitle="One primary per region. <Button> for actions, <ButtonLink> for navigation."
          />

          <div className="space-y-6">
            {/* Rule callout */}
            <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex-1">
                <p className="text-body-sm font-medium mb-1">
                  <code className="text-mono bg-muted px-1 py-0.5 rounded">
                    &lt;Button&gt;
                  </code>{" "}
                  — click actions (onClick, form submits, dialog triggers)
                </p>
                <p className="text-caption">
                  Uses Base UI under the hood. Never wrap a Link inside it — use{" "}
                  <code className="text-mono">ButtonLink</code> instead to avoid
                  hydration mismatches.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-medium mb-1">
                  <code className="text-mono bg-muted px-1 py-0.5 rounded">
                    &lt;ButtonLink&gt;
                  </code>{" "}
                  — navigation (href, router.push)
                </p>
                <p className="text-caption">
                  A Next.js Link styled with buttonVariants. No Base UI wrapper
                  — no nativeButton warnings.
                </p>
              </div>
            </div>

            {/* All 6 variants × 4 sizes */}
            <Card>
              <CardContent className="pt-6 space-y-8">
                {ALL_BUTTON_VARIANTS.map((variant) => (
                  <Group key={variant} label={`variant="${variant}"`}>
                    {ALL_BUTTON_SIZES.map((size) => (
                      <Button key={size} variant={variant} size={size}>
                        {size === "xs" ? variant.slice(0, 3) : variant}
                      </Button>
                    ))}
                    <Button variant={variant} size="icon" aria-label={variant}>
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                    <Button
                      variant={variant}
                      size="icon-sm"
                      aria-label={`${variant} sm`}
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    <Button
                      variant={variant}
                      size="icon-xs"
                      aria-label={`${variant} xs`}
                    >
                      <Plus className="h-3 w-3" strokeWidth={1.75} />
                    </Button>
                  </Group>
                ))}

                <Group label="<ButtonLink> — navigation">
                  <ButtonLink href="/dashboard" size="sm">
                    Dashboard
                  </ButtonLink>
                  <ButtonLink href="/pricing" variant="outline">
                    Pricing
                  </ButtonLink>
                  <ButtonLink href="/billing" variant="secondary" size="lg">
                    Upgrade{" "}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </ButtonLink>
                </Group>

                <Group label="States">
                  <Button>
                    <Sparkles className="h-4 w-4" strokeWidth={1.75} /> Generate
                  </Button>
                  <Button disabled>Disabled</Button>
                  <Button
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 1500);
                    }}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    {loading ? "Generating…" : "Try loading"}
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4" strokeWidth={1.75} /> Download
                    HD
                  </Button>
                </Group>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ─── Forms ─── */}
        <section>
          <SectionHeader
            title="Form elements"
            subtitle="react-hook-form + Zod resolver in real flows"
          />
          <Card>
            <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="d-name">Brand name</Label>
                <Input id="d-name" placeholder="e.g. Sundar Saree Mart" />
                <p className="text-caption">
                  Shown in the watermark on free tier.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="d-lang">Ad language</Label>
                <Select defaultValue="hi">
                  <SelectTrigger id="d-lang">
                    <SelectValue placeholder="Pick a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="d-desc">Product description</Label>
                <Textarea
                  id="d-desc"
                  rows={4}
                  placeholder="Describe the product so we can write punchy copy. e.g. Handloom cotton saree, festival edition, free shipping."
                />
              </div>

              <div className="space-y-2 md:col-span-2 flex items-center justify-between">
                <div>
                  <Label htmlFor="d-watermark">Watermark</Label>
                  <p className="text-caption">
                    Free tier always includes a watermark.
                  </p>
                </div>
                <Switch
                  id="d-watermark"
                  checked={switched}
                  onCheckedChange={setSwitched}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* ─── Cards / status ─── */}
        <section>
          <SectionHeader
            title="Cards, badges, alerts"
            subtitle="Default elevation = border + slight bg lift; no drop shadow"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>For trying things out</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-h2 tabular">
                  ₹0
                  <span className="text-body text-muted-foreground"> /mo</span>
                </p>
                <ul className="space-y-1 text-body-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> 5 generations /
                    month
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> English & Hindi
                  </li>
                  <li className="flex gap-2">
                    <X className="h-4 w-4 text-muted-foreground" /> Watermark on
                    output
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Current plan
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-primary shadow-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Starter</CardTitle>
                  <Badge>Most popular</Badge>
                </div>
                <CardDescription>For solo founders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-h2 tabular">
                  ₹499
                  <span className="text-body text-muted-foreground"> /mo</span>
                </p>
                <ul className="space-y-1 text-body-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> 50 generations /
                    month
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> All 4 languages
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> No watermark, HD
                    download
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <ButtonLink
                  href="/billing?plan=starter"
                  className="w-full justify-center"
                >
                  Upgrade <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </ButtonLink>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For active sellers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-h2 tabular">
                  ₹1,199
                  <span className="text-body text-muted-foreground"> /mo</span>
                </p>
                <ul className="space-y-1 text-body-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> 200 generations /
                    month
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-success" /> Brand kit +
                    priority
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <ButtonLink
                  href="/billing?plan=pro"
                  variant="secondary"
                  className="w-full justify-center"
                >
                  Upgrade
                </ButtonLink>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Generation complete</AlertTitle>
              <AlertDescription>
                3 copy variants ready. Pick one and download.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Quota reached</AlertTitle>
              <AlertDescription>
                You've hit your free-tier limit. Upgrade to keep generating.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-success text-background">Active</Badge>
            <Badge className="bg-warning text-background">Halted</Badge>
            <Badge className="bg-info text-background">Info</Badge>
          </div>
        </section>

        <Separator />

        {/* ─── Generate flow ─── */}
        <section>
          <SectionHeader
            title="Generate flow"
            subtitle="ProgressStepper + CopyVariants — used in canvas-preview"
          />

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-label">
                  ProgressStepper — step 3 running
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressStepper steps={SAMPLE_STEPS} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-label">
                  CopyVariants (Hindi)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CopyVariants
                  variants={SAMPLE_VARIANTS}
                  selectedIndex={variantIdx}
                  onSelect={setVariantIdx}
                  language="hi"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ─── Overlays / interactive ─── */}
        <section>
          <SectionHeader
            title="Overlays"
            subtitle="Dialog · Sheet · Drawer · Popover · Dropdown · Tooltip · Toast"
          />
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger
                  render={<Button variant="outline">Open dialog</Button>}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel subscription?</DialogTitle>
                    <DialogDescription>
                      You'll keep access until the end of your billing period.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost">Keep subscription</Button>
                    <Button variant="destructive">Cancel anyway</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger
                  render={<Button variant="outline">Open sheet</Button>}
                />
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter generations</SheetTitle>
                    <SheetDescription>
                      Narrow the history list by language, date, or template.
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Open drawer</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>New ad</DrawerTitle>
                    <DrawerDescription>
                      Mobile-friendly bottom sheet.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 pb-8" />
                </DrawerContent>
              </Drawer>

              <Popover>
                <PopoverTrigger
                  render={<Button variant="outline">Open popover</Button>}
                />
                <PopoverContent>
                  <p className="text-body-sm">
                    Quick actions menu — wired to keyboard shortcuts.
                  </p>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline">
                      Account <ChevronDown />
                    </Button>
                  }
                />
                <DropdownMenuContent>
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="icon" aria-label="Preview">
                      <Eye />
                    </Button>
                  }
                />
                <TooltipContent>Preview ad</TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                onClick={() =>
                  toast.success("3 copy variants ready", {
                    description: "Pick one and download.",
                  })
                }
              >
                Toast: success
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.error("Background removal failed", {
                    description: "Retrying…",
                  })
                }
              >
                Toast: error
              </Button>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* ─── Tabs / navigation ─── */}
        <section>
          <SectionHeader
            title="Tabs"
            subtitle="Used for in-page section switching (templates, copy variants)"
          />
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="variant1">
                <TabsList>
                  <TabsTrigger value="variant1">Variant 1</TabsTrigger>
                  <TabsTrigger value="variant2">Variant 2</TabsTrigger>
                  <TabsTrigger value="variant3">Variant 3</TabsTrigger>
                </TabsList>
                <TabsContent value="variant1" className="mt-4 text-body">
                  <p className="text-h3">नया ऑफर — आज ही खरीदें</p>
                  <p className="text-body-sm text-muted-foreground mt-1">
                    हाथ से बुनी हुई कॉटन साड़ी पर 20% की छूट।
                  </p>
                </TabsContent>
                <TabsContent value="variant2" className="mt-4 text-body">
                  <p className="text-h3">तोहफा खुद को दीजिए</p>
                  <p className="text-body-sm text-muted-foreground mt-1">
                    फेस्टिवल कलेक्शन — सीमित समय के लिए।
                  </p>
                </TabsContent>
                <TabsContent value="variant3" className="mt-4 text-body">
                  <p className="text-h3">घर बैठे शॉपिंग</p>
                  <p className="text-body-sm text-muted-foreground mt-1">
                    फ्री शिपिंग, कैश ऑन डिलीवरी।
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* ─── Loading / skeleton / progress ─── */}
        <section>
          <SectionHeader
            title="Loading & progress"
            subtitle="Skeletons match shape; spinner for inline only"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton (history card)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-md" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generation progress</CardTitle>
                <CardDescription>32 of 50 used this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    −10
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    +10
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ─── Avatar + scroll area ─── */}
        <section>
          <SectionHeader title="Avatar & scroll area" />
          <Card>
            <CardContent className="pt-6 flex items-center gap-6">
              <Avatar>
                <AvatarImage src="/avatar.png" alt="Avatar" />
                <AvatarFallback>SD</AvatarFallback>
              </Avatar>

              <ScrollArea className="h-32 max-w-sm rounded-md border border-border p-3">
                <div className="space-y-2 text-body-sm">
                  {Array.from({ length: 12 }, (_, i) => `gen-${i + 1}`).map(
                    (id, i) => (
                      <p key={id} className="flex items-center gap-2">
                        <Circle className="h-2 w-2 text-muted-foreground" />
                        Generation #{i + 1} — Hindi · 1×1
                      </p>
                    ),
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* ─── Atmosphere reference ─── */}
        <section>
          <SectionHeader
            title="Atmosphere reference"
            subtitle=".gradient-spotlight · .gradient-aurora · .glass · naming as of v0.2"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl gradient-aurora p-8 border border-border">
              <p className="text-label">.gradient-aurora</p>
              <p className="text-h2 mt-2">Festival sale energy</p>
              <p className="text-body text-muted-foreground mt-2">
                Three radial gradients — saffron, indigo, marigold. Use only for
                hero sections (once per site).
              </p>
            </div>
            <div className="rounded-2xl gradient-spotlight p-8 border border-border">
              <p className="text-label">.gradient-spotlight</p>
              <p className="text-h2 mt-2">Subtle warmth</p>
              <p className="text-body text-muted-foreground mt-2">
                Single saffron radial at 78% −10%. Default hero gradient.
              </p>
            </div>
          </div>

          <p className="text-caption mt-4">
            Note: earlier names{" "}
            <code className="text-mono">.gradient-mesh</code> and{" "}
            <code className="text-mono">.gradient-saffron-radial</code> no
            longer exist — update any usages to{" "}
            <code className="text-mono">.gradient-aurora</code> /{" "}
            <code className="text-mono">.gradient-spotlight</code>.
          </p>
        </section>
      </div>

      <footer className="mt-20 pt-8 border-t border-border">
        <p className="text-caption">
          Source of truth: <code className="text-mono">client/DESIGN.md</code> ·
          Skill: <code className="text-mono">.claude/skills/ui/SKILL.md</code> ·
          Page:{" "}
          <code className="text-mono">client/app/design/showcase.tsx</code>
        </p>
      </footer>
    </main>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-h2">{title}</h2>
      {subtitle ? (
        <p className="text-body text-muted-foreground mt-1">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-label mb-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
