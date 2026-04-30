// client/app/api/templates/route.ts
import { z } from "zod";

import { filterTemplates } from "@/lib/templates/registry";
import { FORMATS, TEMPLATE_CATEGORIES } from "@/lib/types";

const QuerySchema = z.object({
  format: z.enum(FORMATS).optional(),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    format: url.searchParams.get("format") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const list = filterTemplates(parsed.data);

  return Response.json(
    {
      templates: list.map((t) => ({
        id: t.id,
        category: t.category,
        format: t.format,
        config: t,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
  );
}
