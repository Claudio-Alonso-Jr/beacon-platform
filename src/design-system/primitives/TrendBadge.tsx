import { cn } from "../cn";
import { ArrowDownIcon, ArrowUpIcon } from "./Icons";

export interface TrendBadgeProps {
  /** Percentage delta, e.g. 1.2 or -0.4 */
  value: number;
  className?: string;
}

/** The ONLY place green/red appear in the system (§7.2). */
export function TrendBadge({ value, className }: TrendBadgeProps) {
  const positive = value > 0;
  const flat = value === 0;
  const formatted = `${positive ? "+" : ""}${value.toFixed(1)}%`;

  return (
    <span
      className={cn(
        "numeric inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[13px] font-medium",
        flat
          ? "bg-surface-2 text-ink-2"
          : positive
            ? "bg-positive/10 text-positive"
            : "bg-negative/10 text-negative",
        className,
      )}
    >
      {!flat && (positive ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />)}
      {formatted}
    </span>
  );
}
