import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { normalizeHandle } from "@/domain/handle";
import { REFERENCE_HANDLES } from "@/data/profiles";
import { useAnalysisStore, useSessionStore } from "@/stores/analysis";
import { SearchIcon } from "@/design-system/primitives";
import { cn } from "@/design-system/cn";

/**
 * Spotlight-style home (§ priorities): one oversized field, nothing competing.
 * Enter analyzes. `/` focuses from anywhere. Validation is quiet and inline.
 */
export function Home() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recents = useSessionStore((s) => s.recentHandles);

  const result = useMemo(() => normalizeHandle(value), [value]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const analyze = () => {
    setTouched(true);
    if (result.ok) useAnalysisStore.getState().start(result.handle);
  };

  const showError = touched && value.trim() !== "" && !result.ok;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <h1 className="text-center text-[28px] font-semibold tracking-[-0.02em]">
          Instagram Performance
        </h1>
        <p className="mt-1.5 text-center text-sm text-ink-2">
          Analyze any public profile
        </p>

        {/* Spotlight field */}
        <div
          className={cn(
            "mt-8 flex h-16 items-center gap-4 rounded-2xl bg-surface px-6 shadow-overlay",
            "ring-1 ring-transparent transition-shadow duration-200",
            "focus-within:ring-2 focus-within:ring-accent",
          )}
        >
          <SearchIcon size={22} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setTouched(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="@instagram or paste a profile link"
            aria-label="Search Instagram profile"
            className="h-full w-full bg-transparent text-lg text-ink outline-none placeholder:text-ink-3"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <AnimatePresence>
            {result.ok && (
              <motion.button
                key="go"
                type="button"
                onClick={analyze}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="shrink-0 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white hover:brightness-105"
              >
                Analyze
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* quiet feedback line: resolved handle · error · hint */}
        <div className="mt-3 flex h-6 items-center justify-center">
          <AnimatePresence mode="wait">
            {result.ok ? (
              <Feedback key={`ok-${result.handle}`}>
                <span className="rounded-full bg-surface px-3 py-1 text-[13px] text-ink-2 shadow-card">
                  will analyze <span className="font-medium text-ink">@{result.handle}</span>
                  <kbd className="ml-2 text-ink-3">⏎</kbd>
                </span>
              </Feedback>
            ) : showError ? (
              <Feedback key="error">
                <span className="text-[13px] text-negative">{result.reason}</span>
              </Feedback>
            ) : (
              <Feedback key="hint">
                <span className="text-[13px] text-ink-3">
                  press <kbd className="rounded bg-surface-2 px-1.5 py-0.5">/</kbd> to search
                </span>
              </Feedback>
            )}
          </AnimatePresence>
        </div>

        {/* session recents first, reference profiles fill the rest — demos stay one click away */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-10">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-ink-3">
            {recents.length > 0 ? "Quick open" : "Try one of these"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[...recents, ...REFERENCE_HANDLES.filter((h) => !recents.includes(h))]
              .slice(0, 8)
              .map((handle) => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => useAnalysisStore.getState().start(handle)}
                  className="rounded-full bg-surface px-4 py-1.5 text-sm text-ink-2 shadow-card transition-colors hover:text-ink"
                >
                  @{handle}
                </button>
              ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Feedback({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
