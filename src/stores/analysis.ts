import { create } from "zustand";

/**
 * Loading-experience state (§2.1 step 3). Stages map 1:1 to the staged
 * checkmark UI. In Phase 5 the runner binds to real provider fetch stages;
 * until then a simulated runner drives identical UI.
 */
export const ANALYSIS_STAGES = [
  { id: "profile", label: "Loading profile" },
  { id: "posts", label: "Collecting posts" },
  { id: "metrics", label: "Gathering metrics" },
  { id: "processing", label: "Processing data" },
  { id: "building", label: "Building dashboard" },
] as const;

export type StageId = (typeof ANALYSIS_STAGES)[number]["id"];

interface AnalysisState {
  /** Handle currently being analyzed, or null when idle. */
  handle: string | null;
  completed: StageId[];
  start: (handle: string) => void;
  completeStage: (stage: StageId) => void;
  finish: () => void;
  cancel: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  handle: null,
  completed: [],
  start: (handle) => set({ handle, completed: [] }),
  completeStage: (stage) =>
    set((s) => ({
      completed: s.completed.includes(stage) ? s.completed : [...s.completed, stage],
    })),
  finish: () => set({ handle: null, completed: [] }),
  cancel: () => set({ handle: null, completed: [] }),
}));

/** Profiles analyzed this session (in-memory per V1 scope). */
interface SessionState {
  recentHandles: string[];
  addRecent: (handle: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  recentHandles: [],
  addRecent: (handle) =>
    set((s) => ({
      recentHandles: [handle, ...s.recentHandles.filter((h) => h !== handle)].slice(0, 8),
    })),
}));
