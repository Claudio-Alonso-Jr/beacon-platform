import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode;
  inputSize?: "md" | "lg";
}

export function Input({ leading, inputSize = "md", className, ...props }: InputProps) {
  return (
    <div
      className={cn(
        "flex items-center rounded-control bg-surface shadow-card",
        "ring-1 ring-transparent transition-shadow duration-150",
        "focus-within:ring-2 focus-within:ring-accent",
        inputSize === "lg" ? "h-14 px-5 gap-3" : "h-10 px-3.5 gap-2.5",
        className,
      )}
    >
      {leading != null && <span className="shrink-0 text-ink-3">{leading}</span>}
      <input
        className={cn(
          "w-full bg-transparent text-ink placeholder:text-ink-3 outline-none",
          inputSize === "lg" ? "text-lg" : "text-sm",
        )}
        {...props}
      />
    </div>
  );
}
