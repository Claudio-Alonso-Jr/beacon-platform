import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, DashboardSection, SegmentedControl, Skeleton } from "@/design-system/primitives";
import { TIME_RANGES, useDashboardStore } from "@/stores/dashboard";
import { useSnapshot } from "@/data/useSnapshot";
import type { ProviderErrorCode } from "@/data/scraper";
import { DASHBOARD_SECTIONS, widgetsForSection } from "@/widgets/registry";
import { ProfileSnapshotHero } from "@/widgets/ProfileSnapshotHero";
import { Avatar } from "@/widgets/Avatar";
import { AnchorRail } from "@/app/AnchorRail";

/**
 * A narrative, not a dashboard (§ Phase 3 brief): the Profile Snapshot hero
 * lands immediately, then each chapter reveals in sequence. Reveal cadence is
 * timed for now; Phase 5 gates each section on its data readiness instead —
 * `useProgressiveReveal` is the seam.
 */
export function Dashboard() {
  const { handle = "" } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const range = useDashboardStore((s) => s.range);
  const setRange = useDashboardStore((s) => s.setRange);
  const { snapshot, isError, errorCode, refetch } = useSnapshot(handle);
  const revealedCount = useProgressiveReveal(DASHBOARD_SECTIONS.length);

  if (isError) {
    return <ProviderErrorScreen handle={handle} code={errorCode ?? "unavailable"} onRetry={refetch} />;
  }

  return (
    <div className="pb-32">
      {/* sticky top bar: compact identity · global time filter · export */}
      <div className="sticky top-0 z-20 border-b border-hairline bg-canvas/85 backdrop-blur-lg print:hidden">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-4 px-6 md:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-ink hover:opacity-80"
            title="New analysis"
          >
            <Avatar
              handle={handle}
              hue={snapshot?.profile.avatarHue}
              url={snapshot?.profile.avatarUrl}
              className="size-7 text-[13px]"
            />
            <span className="truncate">@{handle}</span>
          </Link>
          <div className="flex-1" />
          <div className="hidden sm:block">
            <SegmentedControl
              aria-label="Time range"
              options={TIME_RANGES}
              value={range}
              onChange={setRange}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/report/${handle}?range=${range}`)}
            title="Open the printable report"
          >
            Export
          </Button>
        </div>
        {/* mobile: filter as its own row of chips */}
        <div className="border-t border-hairline px-4 py-2 sm:hidden">
          <SegmentedControl
            aria-label="Time range"
            options={TIME_RANGES}
            value={range}
            onChange={setRange}
            className="w-full justify-between"
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1080px] px-6 md:px-8">
        {/* centerpiece — immediate */}
        <div className="pt-8 md:pt-12">
          <ProfileSnapshotHero handle={handle} />
        </div>

        {/* chapters — sequential reveal */}
        {DASHBOARD_SECTIONS.slice(0, revealedCount).map((section) => (
          <DashboardSection
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.description}
          >
            {widgetsForSection(section.id).map((widget) => {
              const Widget = widget.component;
              return (
                <Suspense key={widget.id} fallback={<Skeleton className="h-64 w-full rounded-card" />}>
                  <Widget handle={handle} range={range} />
                </Suspense>
              );
            })}
          </DashboardSection>
        ))}
      </div>

      <AnchorRail sections={DASHBOARD_SECTIONS.map(({ id, title }) => ({ id, title }))} />
    </div>
  );
}

const ERROR_COPY: Record<ProviderErrorCode, { title: string; message: string }> = {
  private: {
    title: "This profile is private",
    message: "Only public Instagram profiles can be analyzed. Ask the account owner to connect it directly in a future version.",
  },
  not_found: {
    title: "Profile not found",
    message: "No Instagram profile exists with this handle — check the spelling and try again.",
  },
  rate_limited: {
    title: "Instagram is rate-limiting requests",
    message: "Too many analyses in a short time. Wait a minute, then retry.",
  },
  unavailable: {
    title: "Instagram data is temporarily unavailable",
    message: "The public data source didn't respond. This usually passes — try again shortly.",
  },
  invalid_handle: {
    title: "That doesn't look like a username",
    message: "Handles use letters, numbers, dots and underscores only.",
  },
};

function ProviderErrorScreen({
  handle,
  code,
  onRetry,
}: {
  handle: string;
  code: ProviderErrorCode;
  onRetry: () => void;
}) {
  const copy = ERROR_COPY[code];
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md rounded-card bg-surface p-10 text-center shadow-card">
        <p className="text-sm font-medium text-ink-3">@{handle}</p>
        <h1 className="mt-2 text-xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{copy.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {code !== "private" && code !== "not_found" && (
            <Button onClick={onRetry}>Try again</Button>
          )}
          <Link to="/">
            <Button variant="secondary">New search</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Sequential chapter reveal. Currently cadence-timed (320ms between chapters,
 * starting after the hero settles). Phase 5 replaces the timer with per-section
 * data readiness — same return contract, no UI changes.
 */
function useProgressiveReveal(total: number): number {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(window.setTimeout(() => setRevealed(i), 350 + i * 320));
    }
    return () => timers.forEach(clearTimeout);
  }, [total]);

  return revealed;
}
