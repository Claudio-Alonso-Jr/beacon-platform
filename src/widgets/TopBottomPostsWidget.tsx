import { useState } from "react";
import type { WidgetProps } from "./types";
import type { Post } from "@/domain/types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact, formatDate, performanceBand, type RankedPost } from "@/domain/analytics";
import { Skeleton, WidgetCard } from "@/design-system/primitives";
import { PostThumbnail, POST_TYPE_LABEL } from "./PostThumbnail";
import { PostDetailSheet } from "./PostDetailSheet";
import { BandChip } from "./BandChip";

/**
 * Engagement chapter, part 4: the extremes. Best and weakest posts of the
 * period with objective band labels — no scores, no judgments, no advice.
 */
export default function TopBottomPostsWidget({ handle, range }: WidgetProps) {
  const { engine, analytics } = useAnalytics(handle, range);
  const [selected, setSelected] = useState<Post | null>(null);

  if (!engine || !analytics) {
    return (
      <WidgetCard title="Top & Bottom Posts">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </WidgetCard>
    );
  }

  const { ranked, engagementPerPost } = analytics.posts;
  if (ranked.length === 0) {
    return (
      <WidgetCard title="Top & Bottom Posts" state="empty" emptyMessage="No posts in this period" />
    );
  }

  const top = ranked.slice(0, 3);
  // weakest, excluding anything already shown in top (tiny periods)
  const bottom = [...ranked]
    .reverse()
    .filter((r) => !top.some((t) => t.post.id === r.post.id))
    .slice(0, 3);

  return (
    <>
      <WidgetCard
        title="Top & Bottom Posts"
        subtitle="The strongest and weakest audience response in the period"
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <PostColumn
            heading="Highest engagement"
            entries={top}
            mean={engagementPerPost.average}
            rankOffset={0}
            onOpen={setSelected}
          />
          {bottom.length > 0 && (
            <PostColumn
              heading="Lowest engagement"
              entries={bottom}
              mean={engagementPerPost.average}
              rankOffset={ranked.length - bottom.length}
              reverseRank
              total={ranked.length}
              onOpen={setSelected}
            />
          )}
        </div>
      </WidgetCard>

      <PostDetailSheet
        post={selected}
        onClose={() => setSelected(null)}
        engine={engine}
        postAnalytics={analytics.posts}
      />
    </>
  );
}

function PostColumn({
  heading,
  entries,
  mean,
  rankOffset,
  reverseRank = false,
  total = 0,
  onOpen,
}: {
  heading: string;
  entries: RankedPost[];
  mean: number | undefined;
  rankOffset: number;
  reverseRank?: boolean;
  total?: number;
  onOpen: (post: Post) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-3">
        {heading}
      </p>
      <div className="space-y-2.5">
        {entries.map((entry, i) => {
          const rank = reverseRank ? total - i : rankOffset + i + 1;
          return (
            <button
              key={entry.post.id}
              type="button"
              onClick={() => onOpen(entry.post)}
              className="flex w-full items-center gap-3.5 rounded-card p-2 text-left transition-colors hover:bg-surface-2/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="numeric w-7 shrink-0 text-right text-sm font-semibold text-ink-3">
                #{rank}
              </span>
              <PostThumbnail
                hue={entry.post.thumbnailHue}
                type={entry.post.type}
                url={entry.post.thumbnailUrl}
                className="size-12 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{entry.post.caption}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {POST_TYPE_LABEL[entry.post.type]} · {formatDate(entry.post.postedAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="numeric text-sm font-semibold text-ink">
                  {formatCompact(entry.engagement)}
                </p>
                <BandChip
                  band={performanceBand(entry.engagement, mean, entry.percentile)}
                  className="mt-1"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
