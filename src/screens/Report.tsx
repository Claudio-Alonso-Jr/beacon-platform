import { Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ReportModeContext } from "@/app/report-mode";
import { useSnapshot } from "@/data/useSnapshot";
import {
  formatDateLong,
  RANGE_DAYS,
  TIME_RANGES,
  type TimeRange,
} from "@/domain/analytics";
import { Button, DashboardSection, Skeleton, VerifiedIcon } from "@/design-system/primitives";
import { DASHBOARD_SECTIONS, widgetsForSection } from "@/widgets/registry";

const RANGE_LABEL: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "15d": "Last 15 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6m": "Last 6 months",
  "1y": "Last 12 months",
};

/**
 * The export surface (§9.4): same widgets, executive-report composition.
 * Browser print = PDF. Chapters break one per page via print CSS; report
 * mode renders all entrance animations at their final state.
 */
export function Report() {
  const { handle = "" } = useParams<{ handle: string }>();
  const [params] = useSearchParams();
  const range = parseRange(params.get("range"));
  const { snapshot } = useSnapshot(handle);
  const profile = snapshot?.profile;

  return (
    <ReportModeContext.Provider value={true}>
      <div className="mx-auto max-w-[1024px] px-8 pb-24">
        {/* screen-only control bar */}
        <div className="flex items-center justify-between py-5 print:hidden">
          <Link to={`/p/${handle}`} className="text-sm text-ink-2 hover:text-ink">
            ← Back to dashboard
          </Link>
          <Button onClick={() => window.print()}>Print / Save as PDF</Button>
        </div>

        {/* ——— cover ——— */}
        <header
          className="rounded-card p-10 shadow-card md:p-14"
          style={{
            background:
              "linear-gradient(135deg, var(--ds-accent-wash) 0%, var(--ds-surface) 55%)",
            backgroundColor: "var(--ds-surface)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
              Growth Boss
            </p>
            <p className="text-[13px] text-ink-3">Instagram Performance Report</p>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-full text-3xl font-semibold text-white"
              style={
                profile
                  ? {
                      background: `linear-gradient(140deg,
                        hsl(${profile.avatarHue} 55% 55%),
                        hsl(${(profile.avatarHue + 45) % 360} 60% 42%))`,
                    }
                  : { background: "var(--ds-surface-2)" }
              }
            >
              {handle.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              {profile ? (
                <>
                  <p className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.02em]">
                    {profile.displayName}
                    {profile.isVerified && <VerifiedIcon size={22} className="text-accent" />}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">
                    @{profile.handle}
                    {profile.category && <> · {profile.category}</>}
                  </p>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-52" />
                  <Skeleton className="mt-2 h-4 w-36" />
                </>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 border-t border-hairline pt-6 text-sm">
            <CoverFact label="Period" value={`${RANGE_LABEL[range]} · ${periodDates(range)}`} />
            <CoverFact
              label="Analysis date"
              value={snapshot ? formatDateLong(snapshot.capturedAt) : "…"}
            />
            <CoverFact
              label="Data basis"
              value={
                snapshot
                  ? snapshot.provider === "graph_api"
                    ? "Instagram Business account"
                    : "Public profile data"
                  : "…"
              }
            />
          </div>
        </header>

        {/* ——— chapters, narrative order ——— */}
        {DASHBOARD_SECTIONS.map((section) => (
          <DashboardSection
            key={section.id}
            id={`report-${section.id}`}
            title={section.title}
            description={section.description}
            animate={false}
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

        <p className="mt-16 border-t border-hairline pt-5 text-center text-xs text-ink-3">
          Prepared by Growth Boss · growthboss.co · @{handle} · {RANGE_LABEL[range]}
        </p>
      </div>
    </ReportModeContext.Provider>
  );
}

function CoverFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}

function parseRange(raw: string | null): TimeRange {
  const match = TIME_RANGES.find((r) => r.value === raw);
  return match ? match.value : "30d";
}

function periodDates(range: TimeRange): string {
  const end = new Date();
  const start = new Date(end.getTime() - RANGE_DAYS[range] * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}
