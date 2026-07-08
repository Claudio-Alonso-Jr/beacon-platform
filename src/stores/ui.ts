import { create } from "zustand";

export type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  toggleTheme: () => void;
}

const prefersDark =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

/**
 * UI-only state (§9.2). Theme follows system preference initially;
 * persistence arrives with V1.1 storage.
 */
export const useUiStore = create<UiState>((set) => ({
  theme: prefersDark ? "dark" : "light",
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
}));
