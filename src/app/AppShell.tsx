import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUiStore } from "@/stores/ui";
import { MoonIcon, SearchIcon, SunIcon } from "@/design-system/primitives";
import { cn } from "@/design-system/cn";

/**
 * V1 shell: icon sidebar with Search + theme toggle only.
 * History and Settings slots are reserved for V1.1 (§3).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const isReport = pathname.startsWith("/report");

  return (
    <div className="flex min-h-dvh bg-canvas">
      {!isReport && (
      <aside className="sticky top-0 z-10 flex h-dvh w-16 flex-col items-center gap-2 py-5 print:hidden">
        <Link
          to="/"
          aria-label="Home"
          className="mb-4 flex size-9 items-center justify-center rounded-control bg-accent text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ig
        </Link>

        <Link to="/" title="Search" aria-label="Search" className={sidebarItem(pathname === "/")}>
          <SearchIcon size={18} />
        </Link>

        <div className="flex-1" />

        <button
          type="button"
          title="Toggle theme"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className={sidebarItem(false)}
        >
          {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </aside>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function sidebarItem(active: boolean) {
  return cn(
    "flex size-10 items-center justify-center rounded-control transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    active
      ? "bg-surface text-ink shadow-card"
      : "text-ink-3 hover:bg-surface hover:text-ink",
  );
}
