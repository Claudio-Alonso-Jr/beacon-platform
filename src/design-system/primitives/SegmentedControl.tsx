import { motion } from "framer-motion";
import { cn } from "../cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

/** Time-filter style segmented control with an animated active pill. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-control bg-surface-2 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative h-8 rounded-[0.5rem] px-3 text-[13px] font-medium transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
              active ? "text-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                className="absolute inset-0 rounded-[0.5rem] bg-surface shadow-card"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
