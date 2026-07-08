import { create } from "zustand";
import { TIME_RANGES, type TimeRange } from "@/domain/analytics";

/** Time ranges are domain concepts; re-exported here for UI convenience. */
export { TIME_RANGES };
export type { TimeRange };

interface DashboardState {
  range: TimeRange;
  setRange: (range: TimeRange) => void;
}

/** Global time filter (§2.1 step 5). Changing it never refetches —
 *  the Analytics Engine recomputes from the loaded snapshot (§9.2). */
export const useDashboardStore = create<DashboardState>((set) => ({
  range: "30d",
  setRange: (range) => set({ range }),
}));
