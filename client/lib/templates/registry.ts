/**
 * Template registry — TODO §11.2.
 *
 * Per-template JSON configs live in `lib/templates/configs/`. The registry
 * is the import surface for the renderer and the seed script. Real configs
 * land in §11 — for now we re-export an empty list so imports compile.
 */
import type { TemplateConfig } from "./types";

export const TEMPLATES: TemplateConfig[] = [];

export function getTemplate(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
