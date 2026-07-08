import type { WidgetProps } from "./types";
import { Skeleton, WidgetCard } from "@/design-system/primitives";

/** Content chapter, story 2: ranked list — editorial contrast to the gallery grid. */
export default function TopPostsWidget(_props: WidgetProps) {
  return (
    <WidgetCard title="Top Performing Posts" subtitle="Ranked by engagement">
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="numeric w-5 text-right text-sm font-semibold text-ink-3">
              {i + 1}
            </span>
            <Skeleton className="size-12 shrink-0 rounded-control" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
