import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CopyVariant {
  headline: string;
  subheadline: string;
  cta: string;
}

export interface CopyVariantsProps {
  variants: readonly CopyVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  language: Language;
  className?: string;
}

const LANG_ATTR: Record<Language, string> = {
  en: "en",
  hi: "hi",
  ta: "ta",
  te: "te",
};

export function CopyVariants({
  variants,
  selectedIndex,
  onSelect,
  language,
  className,
}: CopyVariantsProps) {
  return (
    <Tabs
      value={String(selectedIndex)}
      onValueChange={(v) => onSelect(Number(v))}
      className={cn("w-full", className)}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-label">Copy variants</p>
        <TabsList>
          {variants.map((variant, i) => (
            <TabsTrigger key={variant.headline} value={String(i)}>
              {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {variants.map((variant, i) => (
        <TabsContent key={variant.headline} value={String(i)}>
          <div
            lang={LANG_ATTR[language]}
            className="bg-card border border-border rounded-xl p-4 space-y-2"
          >
            <p className="text-h3 min-w-0">{variant.headline}</p>
            <p className="text-body-sm text-muted-foreground min-w-0">
              {variant.subheadline}
            </p>
            <span className="inline-block bg-primary/15 text-primary px-2 py-0.5 rounded-md text-mono">
              {variant.cta}
            </span>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
