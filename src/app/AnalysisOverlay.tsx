import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ANALYSIS_STAGES,
  useAnalysisStore,
  useSessionStore,
  type StageId,
} from "@/stores/analysis";
import { Button } from "@/design-system/primitives";
import { cn } from "@/design-system/cn";

/**
 * Premium staged loading (§2.1). No generic spinner: a calm sequence of
 * completing steps with a thin progress bar. Simulated timings until the
 * real provider stages land in Phase 5 — the UI contract stays identical.
 */
export function AnalysisOverlay() {
  const handle = useAnalysisStore((s) => s.handle);
  const completed = useAnalysisStore((s) => s.completed);

  return (
    <AnimatePresence>
      {handle != null && (
        <motion.div
          key="analysis-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-xl"
        >
          <StageRunner handle={handle} />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-sm rounded-card bg-surface p-8 shadow-overlay"
          >
            {/* pulsing identity mark */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex size-14 items-center justify-center rounded-full bg-accent-faint/40 text-lg font-semibold text-accent"
              >
                {handle.charAt(0).toUpperCase()}
              </motion.div>
              <p className="text-[15px] font-semibold">
                Analyzing <span className="text-accent">@{handle}</span>
              </p>
            </div>

            <ol className="space-y-3">
              {ANALYSIS_STAGES.map((stage, index) => (
                <StageRow
                  key={stage.id}
                  label={stage.label}
                  state={
                    completed.includes(stage.id)
                      ? "done"
                      : index === completed.length
                        ? "active"
                        : "pending"
                  }
                />
              ))}
            </ol>

            {/* thin determinate progress */}
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full bg-accent"
                animate={{ width: `${(completed.length / ANALYSIS_STAGES.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            <div className="mt-5 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => useAnalysisStore.getState().cancel()}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StageRow({ label, state }: { label: string; state: "pending" | "active" | "done" }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "relative flex size-5 items-center justify-center rounded-full transition-colors duration-300",
          state === "done" && "bg-accent text-white",
          state === "active" && "bg-accent/15",
          state === "pending" && "bg-surface-2",
        )}
      >
        {state === "done" && (
          <motion.svg
            viewBox="0 0 12 12"
            className="size-3"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <path
              d="M2.5 6.5 5 9l4.5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
        {state === "active" && (
          <motion.span
            className="size-2 rounded-full bg-accent"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </span>
      <span
        className={cn(
          "text-sm transition-colors duration-300",
          state === "pending" ? "text-ink-3" : "text-ink",
        )}
      >
        {label}
      </span>
    </li>
  );
}

/**
 * Simulated stage timings (Phase 5 replaces this with real fetch progress).
 * Renders nothing; owns the timers and the completion navigation.
 */
function StageRunner({ handle }: { handle: string }) {
  const navigate = useNavigate();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const durations: Record<StageId, number> = {
      profile: 500,
      posts: 900,
      metrics: 800,
      processing: 600,
      building: 450,
    };
    let elapsed = 0;
    ANALYSIS_STAGES.forEach((stage) => {
      elapsed += durations[stage.id];
      timers.current.push(
        window.setTimeout(() => {
          useAnalysisStore.getState().completeStage(stage.id);
        }, elapsed),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        useSessionStore.getState().addRecent(handle);
        useAnalysisStore.getState().finish();
        navigate(`/p/${handle}`);
      }, elapsed + 350),
    );
    return () => timers.current.forEach(clearTimeout);
  }, [handle, navigate]);

  return null;
}
