"use client";
import { useEffect } from "react";

export type Shortcut = {
  /** Single key string or array. Examples: "g", "d", "1", "?" */
  keys: string | readonly string[];
  /** Cmd/Ctrl required? Default false. */
  meta?: boolean;
  /** Shift required? Default false. */
  shift?: boolean;
  /** What to do. */
  handler: (e: KeyboardEvent) => void;
  /** Optional description for a future "press ? for shortcuts" overlay. */
  description?: string;
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  // cmdk inputs use role=combobox
  if (target.getAttribute("role") === "combobox") return true;
  return false;
};

/** Bind a list of keyboard shortcuts. Listener is added on mount, removed on
 *  unmount. Shortcuts do NOT fire when an input/textarea/contenteditable is
 *  focused (so "g" in a URL bar doesn't trigger Generate). */
export function useShortcuts(shortcuts: readonly Shortcut[]): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      for (const s of shortcuts) {
        const keys = typeof s.keys === "string" ? [s.keys] : s.keys;
        if (!keys.includes(e.key)) continue;
        if (s.meta && !(e.metaKey || e.ctrlKey)) continue;
        if (!s.meta && (e.metaKey || e.ctrlKey)) continue;
        if (s.shift !== undefined && s.shift !== e.shiftKey) continue;
        e.preventDefault();
        s.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
