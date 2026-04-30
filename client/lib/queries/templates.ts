import { useQuery } from "@tanstack/react-query";

import type { TemplateConfig } from "@/lib/templates/types";
import type { Format, TemplateCategory } from "@/lib/types";

export interface TemplatesQueryFilter {
  format?: Format;
  category?: TemplateCategory;
}

interface TemplatesResponse {
  templates: Array<{
    id: string;
    category: TemplateCategory;
    format: Format;
    config: TemplateConfig;
  }>;
}

/** Fetches the template registry from the server. Stable in the cache for
 *  5 minutes since templates are server-defined and don't change without
 *  a deploy. */
export function useTemplates(filter: TemplatesQueryFilter = {}) {
  return useQuery({
    queryKey: ["templates", filter] as const,
    queryFn: async (): Promise<TemplateConfig[]> => {
      const params = new URLSearchParams();
      if (filter.format) params.set("format", filter.format);
      if (filter.category) params.set("category", filter.category);
      const url = `/api/templates${params.size ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Templates fetch failed: ${res.status}`);
      const json = (await res.json()) as TemplatesResponse;
      return json.templates.map((t) => t.config);
    },
    staleTime: 5 * 60 * 1000,
  });
}
