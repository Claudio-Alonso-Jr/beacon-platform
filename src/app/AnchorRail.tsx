import { useEffect, useState } from "react";
import { cn } from "@/design-system/cn";

interface RailSection {
  id: string;
  title: string;
}

/**
 * Right-edge scroll-spy dots (§4). Desktop ≥1280px only. The dashboard is
 * one scrollable narrative; the rail is its table of contents.
 */
export function AnchorRail({ sections }: { sections: RailSection[] }) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Sections"
      className="fixed right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 xl:flex print:hidden"
    >
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          title={section.title}
          aria-label={section.title}
          aria-current={activeId === section.id ? "true" : undefined}
          onClick={() =>
            document
              .getElementById(section.id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="group flex items-center justify-center p-1"
        >
          <span
            className={cn(
              "block rounded-full transition-all duration-300",
              activeId === section.id
                ? "h-5 w-1.5 bg-accent"
                : "size-1.5 bg-ink-3/50 group-hover:bg-ink-2",
            )}
          />
        </button>
      ))}
    </nav>
  );
}
