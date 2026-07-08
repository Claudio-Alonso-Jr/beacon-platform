import type { WidgetProps } from "./types";
import { Button, WidgetCard } from "@/design-system/primitives";

/** Export chapter: PDF / Print / PNG. Pipeline lands in Phase 9 (§9.4). */
export default function ExportWidget(_props: WidgetProps) {
  return (
    <WidgetCard
      title="Share this analysis"
      subtitle="Exports preserve the dashboard's appearance"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled title="Available in Phase 9">
          Export PDF
        </Button>
        <Button variant="secondary" disabled title="Available in Phase 9">
          Print
        </Button>
        <Button variant="secondary" disabled title="Available in Phase 9">
          Save as PNG
        </Button>
        <span className="text-[13px] text-ink-3">Export pipeline arrives in Phase 9</span>
      </div>
    </WidgetCard>
  );
}
