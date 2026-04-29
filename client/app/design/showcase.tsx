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
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    label: "Display · 56/64 · 600",
    text: "Make ads people stop scrolling for.",
  },
  {
    className: "text-h1",
    label: "Heading 1 · 36/44 · 600",
    text: "Your festival sale, ready in 30 seconds",
  },
  {
    className: "text-h2",
    label: "Heading 2 · 28/36 · 600",
    text: "Generate. Preview. Download.",
  },
  {
    className: "text-h3",
    label: "Heading 3 · 22/30 · 600",
    text: "Three variants, one tap",
  },
  {
    className: "text-body",
    label: "Body · 15/24 · 400",
    text: "Drop a product photo or paste a URL — we extract the details, remove the background, and generate copy in your language.",
  },
  {
    className: "text-body-sm",
    label: "Body small · 13/20 · 400",
    text: "Used in tables, secondary descriptions, and dense lists.",
  },
  {
    className: "text-caption",
    label: "Caption · 12/16 · 400 muted",
    text: "Helper text and subtle metadata.",
  },
  {
    className: "text-label",
    label: "Label · 12/16 · 500 uppercase",
    text: "Section eyebrow",
  },
];

const INDIC_SAMPLES = [
  { lang: "en", text: "New offer — buy today and save 20%." },
  { lang: "hi", text: "नया ऑफर — आज ही खरीदें और 20% बचाएँ।" },
  { lang: "ta", text: "புதிய சலுகை — இன்றே வாங்கி 20% சேமியுங்கள்." },
  { lang: "te", text: "కొత్త ఆఫర్ — ఈరోజే కొనండి, 20% ఆదా చేయండి." },
];

export function DesignShowcase() {
  const [progress, setProgress] = useState(45);
  const [loading, setLoading] = useState(false);
  const [switched, setSwitched] = useState(true);

  return (
    <main
      id="main"
      className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
    >
      {/* Header */}
      <header className="mb-12 lg:mb-16">
        <div className="flex items-center gap-2 text-label mb-4">
          <Palette className="h-3.5 w-3.5" />
          Design system · v0.1
        </div>
        <h1 className="text-display max-w-3xl">
          The visual lock for <span className="text-primary">AdCreator</span>.
        </h1>
        <p className="text-body text-muted-foreground mt-4 max-w-2xl">
          Every component, token, and motion sample lives here. If something on
          this page looks wrong, the design system is broken — fix it before
          shipping new UI elsewhere.
        </p>
      </header>

      <div className="space-y-16">
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
                className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-baseline"
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

        {/* ─── Buttons ─── */}
        <section>
          <SectionHeader
            title="Buttons"
            subtitle="One primary per region. Sizes: sm · default · lg · icon."
          />
          <Card>
            <CardContent className="pt-6 space-y-6">
              <Group label="Variants">
                <Button>Generate ad</Button>
                <Button variant="secondary">Save draft</Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="ghost">Skip</Button>
                <Button variant="link">Learn more</Button>
                <Button variant="destructive">
                  <Trash2 /> Delete
                </Button>
              </Group>

              <Group label="Sizes">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Add">
                  <Plus />
                </Button>
              </Group>

              <Group label="States">
                <Button>
                  <Sparkles /> Generate
                </Button>
                <Button disabled>Disabled</Button>
                <Button
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1500);
                  }}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  {loading ? "Generating…" : "Try loading"}
                </Button>
                <Button variant="outline">
                  <Download /> Download HD
                </Button>
              </Group>
            </CardContent>
          </Card>
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
                <Button className="w-full">
                  Upgrade <ArrowRight />
                </Button>
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
                <Button variant="secondary" className="w-full">
                  Upgrade
                </Button>
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

        {/* ─── Marketing utility samples ─── */}
        <section>
          <SectionHeader
            title="Marketing utilities"
            subtitle=".gradient-mesh, .gradient-saffron-radial, .glass"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl gradient-mesh p-8 border border-border">
              <p className="text-label">.gradient-mesh</p>
              <p className="text-h2 mt-2">Festival sale energy</p>
              <p className="text-body text-muted-foreground mt-2">
                Three radial gradients — saffron, indigo, marigold. Use only for
                hero sections.
              </p>
            </div>
            <div className="rounded-2xl gradient-saffron-radial p-8 border border-border">
              <p className="text-label">.gradient-saffron-radial</p>
              <p className="text-h2 mt-2">Subtle warmth</p>
              <p className="text-body text-muted-foreground mt-2">
                Single saffron radial in the top right. Default hero gradient.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-20 pt-8 border-t border-border">
        <p className="text-caption">
          Source of truth: <code className="text-mono">client/DESIGN.md</code> ·
          Skill: <code className="text-mono">.claude/skills/ui/SKILL.md</code>
        </p>
      </footer>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
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
      <p className="text-label mb-2">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
