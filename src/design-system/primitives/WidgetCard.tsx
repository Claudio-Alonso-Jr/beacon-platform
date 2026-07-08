import type { ReactNode } from "react";
import { cn } from "../cn";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { LockIcon, RetryIcon } from "./Icons";

export type WidgetState = "ready" | "loading" | "empty" | "error" | "locked";

export interface WidgetCardProps {
  /** Optional in-card title row (section titles live outside cards, §7.6). */
  title?: string;
  subtitle?: string;
  /** Right-aligned controls (sort menus, filters) — appear on hover (§7.6). */
  action?: ReactNode;
  state?: WidgetState;
  emptyMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * The universal widget frame. Every dashboard block ships the five states
 * from day one: ready / loading / empty / error / locked (§7.4).
 */
export function WidgetCard({
  title,
  subtitle,
  action,
  state = "ready",
  emptyMessage = "No data in this period",
  onRetry,
  children,
  className,
  contentClassName,
}: WidgetCardProps) {
  return (
    <section
      className={cn(
        "group relative rounded-card bg-surface p-6 shadow-card",
        className,
      )}
    >
      {(title != null || action != null) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[13px] text-ink-2">{subtitle}</p>}
          </div>
          {action && (
            /* hover-reveal is desktop-only — touch devices always see controls */
            <div className="transition-opacity duration-150 focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 print:hidden">
              {action}
            </div>
          )}
        </div>
      )}

      {state === "ready" && <div className={contentClassName}>{children}</div>}

      {state === "loading" && (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {state === "empty" && (
        <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-ink-2">{emptyMessage}</p>
          <p className="text-[13px] text-ink-3">Try a wider time range</p>
        </div>
      )}

      {state === "error" && (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-medium text-ink-2">Couldn't load this data</p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RetryIcon size={14} /> Retry
            </Button>
          )}
        </div>
      )}

      {state === "locked" && <LockedOverlay>{children}</LockedOverlay>}
    </section>
  );
}

/** Blurred preview + honest explanation + connect CTA (§7.4). */
function LockedOverlay({ children }: { children?: ReactNode }) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none min-h-40 blur-[10px] opacity-40 select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-ink-2">
          <LockIcon size={16} />
        </span>
        <p className="text-sm font-medium text-ink">Requires Instagram Business connection</p>
        <p className="max-w-60 text-[13px] text-ink-2">
          This metric isn't available from public data
        </p>
        <Button variant="secondary" size="sm" className="mt-1" disabled title="Available in V1.1">
          Connect account
        </Button>
      </div>
    </div>
  );
}
