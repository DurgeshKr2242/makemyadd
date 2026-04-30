/**
 * Template registry — TODO §11.2.
 *
 * Single source of truth for which templates exist. Imported by:
 *   - GET /api/templates (server)
 *   - <TemplateSelector /> (client)
 *   - the marketing /templates page
 */
import type { Format, TemplateCategory } from "@/lib/types";

import { ALL_TEMPLATES } from "./configs";
import type { TemplateConfig } from "./types";

export const TEMPLATES: readonly TemplateConfig[] = ALL_TEMPLATES;

export function getTemplate(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export interface TemplateFilter {
  format?: Format;
  category?: TemplateCategory;
}

export function filterTemplates(
  filter: TemplateFilter,
): readonly TemplateConfig[] {
  return TEMPLATES.filter((t) => {
    if (filter.format && t.format !== filter.format) return false;
    if (filter.category && t.category !== filter.category) return false;
    return true;
  });
}
