import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANGUAGE_LABELS,
  LANGUAGES,
  type Language,
  TONES,
  type Tone,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export interface LanguagePickerProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  className?: string;
}

const TONE_LABELS: Record<Tone, string> = {
  festive: "Festive",
  urgent: "Urgent",
  trust: "Trust",
  showcase: "Showcase",
};

export function LanguagePicker({
  language,
  onLanguageChange,
  tone,
  onToneChange,
  className,
}: LanguagePickerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Language chips */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="text-label mb-2">Language</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const active = lang === language;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-sm px-3 py-1 text-body-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-accent",
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Tone select */}
      <div>
        <p className="text-label mb-2">Tone</p>
        <Select value={tone} onValueChange={(v) => onToneChange(v as Tone)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            {TONES.map((t) => (
              <SelectItem key={t} value={t}>
                {TONE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
