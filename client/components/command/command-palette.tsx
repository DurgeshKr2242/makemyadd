"use client";

import {
  BookOpen,
  Bug,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Moon,
  PenSquare,
  Settings,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// ─── Module-level open/setter store ──────────────────────────────────────────
// Pattern: one exported `openCommandPalette()` function calls the registered
// setter. No context provider, no global state library — just one boolean.

let _openSetter: ((open: boolean) => void) | null = null;

/** Call from anywhere to open the palette imperatively (e.g. keyboard shortcut trigger in header). */
export function openCommandPalette() {
  _openSetter?.(true);
}

// ─── Action types ─────────────────────────────────────────────────────────────

type NavAction = {
  kind: "nav";
  href: string;
};
type ToastAction = {
  kind: "toast";
  message: string;
};
type NoOpAction = {
  kind: "noop";
};

type PaletteAction = NavAction | ToastAction | NoOpAction;

interface PaletteItem {
  label: string;
  icon: React.ReactNode;
  action: PaletteAction;
}

interface PaletteGroup {
  heading: string;
  items: PaletteItem[];
}

const PALETTE_GROUPS: PaletteGroup[] = [
  {
    heading: "Navigate",
    items: [
      {
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/dashboard" },
      },
      {
        label: "History",
        icon: <Clock className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/history" },
      },
      {
        label: "Billing",
        icon: <CreditCard className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/billing" },
      },
      {
        label: "Settings",
        icon: <Settings className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/settings" },
      },
      {
        label: "Templates",
        icon: <LayoutTemplate className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/templates" },
      },
      {
        label: "Pricing",
        icon: <Tag className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/pricing" },
      },
    ],
  },
  {
    heading: "Make",
    items: [
      {
        label: "New ad",
        icon: <PenSquare className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/dashboard" },
      },
      {
        label: "View saved drafts",
        icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "toast", message: "Drafts coming soon." },
      },
    ],
  },
  {
    heading: "Theme",
    items: [
      {
        label: "Toggle dark mode",
        icon: <Moon className="h-4 w-4" strokeWidth={1.75} />,
        // Dark-only at MVP — no-op with informative toast
        action: {
          kind: "toast",
          message: "Dark mode only at MVP. Light mode coming in Phase 2.",
        },
      },
    ],
  },
  {
    heading: "Help",
    items: [
      {
        label: "Open documentation",
        icon: <BookOpen className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "/docs" },
      },
      {
        label: "Send feedback",
        icon: <Mail className="h-4 w-4" strokeWidth={1.75} />,
        action: { kind: "nav", href: "mailto:hello@adcreator.in" },
      },
      {
        label: "Report a bug",
        icon: <Bug className="h-4 w-4" strokeWidth={1.75} />,
        action: {
          kind: "nav",
          href: "mailto:hello@adcreator.in?subject=Bug+report",
        },
      },
    ],
  },
];

// ─── CommandPalette component ─────────────────────────────────────────────────

export function CommandPalette(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Register the setter for external openers
  useEffect(() => {
    _openSetter = setOpen;
    return () => {
      _openSetter = null;
    };
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (action: PaletteAction) => {
    setOpen(false);

    if (action.kind === "nav") {
      router.push(action.href);
    } else if (action.kind === "toast") {
      toast.message(action.message);
    }
    // noop: just close
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands…" />
      <CommandList>
        <CommandEmpty className="text-caption py-6">No matches</CommandEmpty>

        {PALETTE_GROUPS.map((group, i) => (
          <>
            {i > 0 && <CommandSeparator key={`sep-${group.heading}`} />}
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => handleSelect(item.action)}
                >
                  {item.icon}
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
