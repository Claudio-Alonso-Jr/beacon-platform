import { motion } from "framer-motion";
import { cn } from "../cn";
import { TrendBadge } from "./TrendBadge";
import { LockIcon } from "./Icons";

export type MetricState = "measured" | "observed" | "locked";

export interface KpiCardProps {
  label: string;
  /** Pre-formatted value, e.g. "302.4M" — formatting lives in domain/analytics. */
  value?: string;
  /** Percentage delta vs previous period. */
  delta?: number;
  /**
   * measured = Graph API · observed = public/scraped · locked = needs Business
   * connection (§ exec summary #1). Observed values show a subtle ring marker.
   */
  state?: MetricState;
  /** Hero cards get the 40px numeral treatment; default cards stay quiet (§7.6). */
  hero?: boolean;
  /** e.g. "Public engagement basis" — formula transparency (§6). */
  note?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  state = "observed",
  hero = false,
  note,
  className,
}: KpiCardProps) {
  const locked = state === "locked";

  return (
    <div
      className={cn(
        "rounded-card bg-surface shadow-card",
        hero ? "p-6" : "px-5 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-medium text-ink-2",
            hero ? "text-sm" : "text-[13px]",
          )}
        >
          {label}
        </span>
        {state === "observed" && !locked && (
          <span
            title="Observed from public data"
            aria-label="Observed from public data"
            className="size-1.5 rounded-full bg-accent-faint"
          />
        )}
        {locked && <LockIcon size={13} className="text-ink-3" />}
      </div>

      {locked ? (
        <p className={cn("mt-2 leading-snug text-ink-3", hero ? "text-sm" : "text-[13px]")}>
          Requires Business connection
        </p>
      ) : (
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "kpi-value font-semibold text-ink",
              hero ? "text-[40px] leading-none" : "text-xl leading-none",
            )}
          >
            {value}
          </motion.span>
          {delta !== undefined && <TrendBadge value={delta} />}
        </div>
      )}

      {note && !locked && <p className="mt-2 text-xs text-ink-3">{note}</p>}
    </div>
  );
}
