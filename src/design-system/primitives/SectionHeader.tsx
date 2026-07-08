import { cn } from "../cn";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  id?: string;
}

/**
 * Chapter header (§7.6): lives OUTSIDE cards, Apple-Health style.
 * 24px semibold title + one quiet descriptive line.
 */
export function SectionHeader({ title, description, className, id }: SectionHeaderProps) {
  return (
    <header id={id} className={cn("mb-5", className)}>
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
    </header>
  );
}
