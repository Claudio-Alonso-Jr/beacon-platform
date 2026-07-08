import type { PerformanceBand } from "@/domain/analytics";
import { cn } from "@/design-system/cn";

const LABELS: Record<PerformanceBand, string> = {
  top10: "Top 10%",
  above: "Above average",
  average: "Average",
  below: "Below average",
};

/**
 * Objective performance label from the Analytics Engine's banding rules.
 * Deliberately neutral colors — green/red stay reserved for deltas (§7.2).
 */
export function BandChip({ band, className }: { band: PerformanceBand; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        band === "top10" && "bg-accent text-white",
        band === "above" && "bg-accent-faint/40 text-accent",
        band === "average" && "bg-surface-2 text-ink-2",
        band === "below" && "bg-surface-2 text-ink-3",
        className,
      )}
    >
      {LABELS[band]}
    </span>
  );
}
