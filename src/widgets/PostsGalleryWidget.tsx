import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { WidgetProps } from "./types";
import type { Post } from "@/domain/types";
import { useAnalytics } from "@/data/useAnalytics";
import { formatCompact, formatDate, postsInRange } from "@/domain/analytics";
import {
  CommentIcon,
  EyeIcon,
  HeartIcon,
  Skeleton,
  WidgetCard,
} from "@/design-system/primitives";
import { PostThumbnail, POST_TYPE_LABEL } from "./PostThumbnail";
import { PostDetailSheet } from "./PostDetailSheet";

const PAGE_SIZE = 12;

/**
 * Content chapter, story 1: what was published. Hover reveals metrics as a
 * soft overlay; click opens the detail side panel.
 */
export default function PostsGalleryWidget({ handle, range }: WidgetProps) {
  const { snapshot, engine, analytics } = useAnalytics(handle, range);
  const [selected, setSelected] = useState<Post | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // changing the period resets pagination — stale "show more" depth is confusing
  useEffect(() => setVisibleCount(PAGE_SIZE), [range]);

  const posts = useMemo(
    () =>
      snapshot
        ? [...postsInRange(snapshot.posts, range)].sort(
            (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
          )
        : [],
    [snapshot, range],
  );

  if (!snapshot || !engine || !analytics) {
    return (
      <WidgetCard title="Content Gallery">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-card" />
          ))}
        </div>
      </WidgetCard>
    );
  }

  if (posts.length === 0) {
    return (
      <WidgetCard
        title="Content Gallery"
        state="empty"
        emptyMessage="No posts published in this period"
      />
    );
  }

  const visible = posts.slice(0, visibleCount);

  return (
    <>
      <WidgetCard
        title="Content Gallery"
        subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"} in the selected period`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((post, index) => (
            <GalleryCard
              key={post.id}
              post={post}
              index={index}
              onOpen={() => setSelected(post)}
            />
          ))}
        </div>
        {posts.length > visibleCount && (
          <div className="mt-5 flex justify-center print:hidden">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="rounded-full bg-surface-2 px-4 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
            >
              Show {Math.min(PAGE_SIZE, posts.length - visibleCount)} more
            </button>
          </div>
        )}
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

function GalleryCard({
  post,
  index,
  onOpen,
}: {
  post: Post;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 11) * 0.03, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative block w-full overflow-hidden rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <PostThumbnail hue={post.thumbnailHue} type={post.type} className="aspect-square w-full rounded-none" />

      {/* hover veil with metrics */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="flex items-center gap-3 text-[13px] font-medium text-white">
          <span className="numeric flex items-center gap-1">
            <HeartIcon size={13} /> {formatCompact(post.metrics.likes.value)}
          </span>
          <span className="numeric flex items-center gap-1">
            <CommentIcon size={13} /> {formatCompact(post.metrics.comments.value)}
          </span>
          {post.metrics.views && (
            <span className="numeric flex items-center gap-1">
              <EyeIcon size={13} /> {formatCompact(post.metrics.views.value)}
            </span>
          )}
        </div>
      </div>

      {/* always-visible footer strip — likes included so touch users aren't blind */}
      <div className="flex items-center justify-between gap-2 bg-surface px-1.5 py-2">
        <span className="numeric flex items-center gap-2 text-xs text-ink-3">
          {formatDate(post.postedAt)}
          <span className="flex items-center gap-0.5 text-ink-2">
            <HeartIcon size={11} /> {formatCompact(post.metrics.likes.value)}
          </span>
        </span>
        <span className="text-xs font-medium text-ink-2">{POST_TYPE_LABEL[post.type]}</span>
      </div>
    </motion.button>
  );
}
