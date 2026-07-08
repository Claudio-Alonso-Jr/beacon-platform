import { useState } from "react";
import { motion } from "framer-motion";
import {
  Button,
  Input,
  KpiCard,
  SearchIcon,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  TrendBadge,
  VerifiedIcon,
  WidgetCard,
} from "@/design-system/primitives";

const TIME_RANGES = [
  { value: "7d", label: "7d" },
  { value: "15d", label: "15d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1y" },
] as const;

type TimeRange = (typeof TIME_RANGES)[number]["value"];

const stagger = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

/**
 * Phase 1 deliverable: living design-system reference.
 * Every primitive, every state, both themes (toggle in sidebar).
 * The page itself follows the §7.6 chapter rhythm it documents.
 */
export function Showcase() {
  const [range, setRange] = useState<TimeRange>("30d");

  return (
    <div className="mx-auto max-w-[1080px] px-8 pb-32 pt-14">
      <p className="text-sm font-medium text-accent">Design System · Phase 1</p>
      <h1 className="mt-2 text-[40px] font-semibold leading-tight tracking-[-0.03em]">
        Instagram Performance Dashboard
      </h1>
      <p className="mt-2 max-w-lg text-ink-2">
        Tokens and primitives for the executive dashboard. Toggle dark mode from
        the sidebar — every color below is a semantic token swap.
      </p>

      {/* ————— Color ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="Color"
          description="One accent. Charts use its monochrome family; green and red are reserved for deltas."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ColorChip name="accent" className="bg-accent text-white" />
          <ColorChip name="accent-soft" className="bg-accent-soft text-white" />
          <ColorChip name="accent-faint" className="bg-accent-faint text-ink" />
          <ColorChip name="surface" className="bg-surface text-ink shadow-card" />
          <ColorChip name="surface-2" className="bg-surface-2 text-ink" />
          <ColorChip name="ink / ink-2 / ink-3" className="bg-surface text-ink shadow-card" sub />
          <ColorChip name="positive · deltas only" className="bg-positive text-white" />
          <ColorChip name="negative · deltas only" className="bg-negative text-white" />
        </div>
      </motion.section>

      {/* ————— Typography ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="Typography"
          description="Inter with tabular numerals on every metric. Scale: 12 / 13 / 14 / 16 / 20 / 24 / 32 / 48."
        />
        <div className="rounded-card bg-surface p-8 shadow-card">
          <p className="kpi-value text-5xl font-semibold">302.4M</p>
          <p className="mt-1 text-sm text-ink-2">48 semibold · KPI hero numeral</p>
          <hr className="my-6 border-hairline" />
          <p className="text-2xl font-semibold tracking-[-0.02em]">Section title — 24 semibold</p>
          <p className="mt-3 text-[15px]">Widget title — 15 semibold</p>
          <p className="mt-2 text-sm text-ink-2">Body secondary — 14 regular, ink-2</p>
          <p className="mt-2 text-[13px] text-ink-3">Caption / axis — 13, ink-3</p>
        </div>
      </motion.section>

      {/* ————— Controls ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="Controls"
          description="Buttons, search input, and the global time filter."
        />
        <div className="space-y-6 rounded-card bg-surface p-8 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Analyze</Button>
            <Button variant="secondary">Export PDF</Button>
            <Button variant="ghost">Cancel</Button>
            <Button size="sm" variant="secondary">
              Retry
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <Input
            inputSize="lg"
            leading={<SearchIcon size={20} />}
            placeholder="@instagram — search any public profile"
            aria-label="Search Instagram profile"
          />
          <div className="flex items-center gap-4">
            <SegmentedControl
              aria-label="Time range"
              options={TIME_RANGES}
              value={range}
              onChange={setRange}
            />
            <span className="text-[13px] text-ink-3">
              selected: <span className="numeric font-medium text-ink-2">{range}</span>
            </span>
          </div>
        </div>
      </motion.section>

      {/* ————— KPI cards ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="KPI cards"
          description="Three honesty states: measured (Graph API), observed (public data, dot marker), locked (never a fake number)."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard hero label="Followers" value="302.4M" delta={1.2} state="observed" />
          <KpiCard hero label="Growth" value="+3.6M" delta={0.4} state="observed" />
          <KpiCard hero label="Engagement Rate" value="1.8%" delta={-0.2} state="observed" note="Public engagement basis" />
          <KpiCard hero label="Posts" value="24" state="observed" />
        </div>
        <p className="mb-2 mt-6 text-[13px] font-medium text-ink-3">
          More metrics — visually subordinate strip (§7.6)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Avg Likes" value="412K" state="observed" />
          <KpiCard label="Avg Comments" value="3.1K" state="observed" />
          <KpiCard label="Avg Views" value="2.9M" state="observed" />
          <KpiCard label="Reach" state="locked" />
          <KpiCard label="Saves" state="locked" />
          <KpiCard label="Shares" state="locked" />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <TrendBadge value={12.4} />
          <TrendBadge value={-3.1} />
          <TrendBadge value={0} />
          <span className="text-[13px] text-ink-3">trend badges — the only green/red in the system</span>
        </div>
      </motion.section>

      {/* ————— Widget frame states ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="Widget frame"
          description="Every dashboard block ships five states from day one. Hover a card to reveal its controls."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <WidgetCard
            title="Followers Evolution"
            subtitle="Last 30 days vs previous period"
            action={<Button variant="ghost" size="sm">Compare</Button>}
          >
            <ChartPlaceholder />
          </WidgetCard>
          <WidgetCard title="Loading" subtitle="Skeleton mirrors final layout" state="loading" />
          <WidgetCard title="Empty" state="empty" emptyMessage="No posts in this period" />
          <WidgetCard title="Error" state="error" onRetry={() => undefined} />
          <WidgetCard title="Reach & Impressions" state="locked" className="lg:col-span-2">
            <ChartPlaceholder />
          </WidgetCard>
        </div>
      </motion.section>

      {/* ————— Profile Snapshot preview ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="Profile Snapshot"
          description="The identity hero card that opens every dashboard — preview with static data; the real widget arrives in Phase 4."
        />
        <div
          className="rounded-card p-10 shadow-card"
          style={{
            background:
              "linear-gradient(135deg, var(--ds-accent-wash) 0%, var(--ds-surface) 55%)",
            backgroundColor: "var(--ds-surface)",
          }}
        >
          <div className="flex items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-full bg-accent-faint text-2xl font-semibold text-accent">
              N
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-2xl font-semibold tracking-[-0.02em]">
                Nike <VerifiedIcon size={20} className="text-accent" />
              </p>
              <p className="text-sm text-ink-2">@nike · Sportswear &amp; Athletic</p>
              <p className="mt-1 text-sm text-ink-2">
                "Just do it." · <span className="text-accent">nike.com</span>
              </p>
            </div>
          </div>
          <div className="mt-8 flex gap-14">
            <Stat value="302.4M" label="Followers" />
            <Stat value="158" label="Following" />
            <Stat value="1,240" label="Posts" />
          </div>
          <p className="mt-6 text-right text-[13px] text-ink-3">
            Analyzed Jul 8, 2026 · via public data
          </p>
        </div>
      </motion.section>

      {/* ————— Elevation & shape ————— */}
      <motion.section {...stagger} className="mt-24">
        <SectionHeader
          title="Elevation & shape"
          description="No borders — depth comes from one soft ambient shadow. Cards 16px, controls 10px, chips full."
        />
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex h-28 w-40 items-end rounded-card bg-surface p-3 text-[13px] text-ink-3 shadow-card">
            card · shadow-card
          </div>
          <div className="flex h-28 w-40 items-end rounded-card bg-surface p-3 text-[13px] text-ink-3 shadow-overlay">
            overlay · sheets
          </div>
          <Skeleton className="h-28 w-40 rounded-card" />
        </div>
      </motion.section>
    </div>
  );
}

function ColorChip({ name, className, sub = false }: { name: string; className: string; sub?: boolean }) {
  return (
    <div className={`flex h-20 flex-col justify-end rounded-card p-3 ${className}`}>
      {sub ? (
        <p className="text-[13px] font-medium">
          ink <span className="text-ink-2">ink-2</span> <span className="text-ink-3">ink-3</span>
        </p>
      ) : (
        <p className="text-[13px] font-medium">{name}</p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="kpi-value text-[32px] font-semibold leading-none">{value}</p>
      <p className="mt-1.5 text-sm text-ink-2">{label}</p>
    </div>
  );
}

/** Hairline-grid stand-in until Recharts lands in Phase 6. */
function ChartPlaceholder() {
  return (
    <svg viewBox="0 0 560 180" className="h-44 w-full" aria-hidden>
      {[0, 45, 90, 135, 180].map((y) => (
        <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="var(--ds-hairline)" strokeDasharray="3 5" />
      ))}
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,150 C80,140 120,100 200,105 C280,110 320,60 400,55 C460,52 520,30 560,24 L560,180 L0,180 Z"
        fill="url(#fill)"
      />
      <path
        d="M0,150 C80,140 120,100 200,105 C280,110 320,60 400,55 C460,52 520,30 560,24"
        fill="none"
        stroke="var(--ds-accent)"
        strokeWidth="2"
      />
    </svg>
  );
}
