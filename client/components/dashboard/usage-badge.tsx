/**
 * Usage badge in the dashboard header.
 *
 * Shows `${used}/${limit} this month` with a progress ring. At ≥80% nudges
 * upgrade; at 100% disables the Generate button via the parent flow.
 *
 * Quota math source: TODO §11.2 (`lib/quota.ts`). For now this is a static
 * placeholder so the header has the right shape.
 */
import { Badge } from "@/components/ui/badge";

export function UsageBadge() {
  // Hard-coded until lib/quota.ts and the profile fetch land (§11.2 / §6).
  const used = 0;
  const limit = 5;
  return (
    <Badge
      variant="outline"
      className="hidden sm:inline-flex font-mono text-[11px] tabular"
    >
      {used}/{limit}
    </Badge>
  );
}
