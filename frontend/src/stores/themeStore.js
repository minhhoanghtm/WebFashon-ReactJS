import { create } from "zustand";

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDom(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;

  root.setAttribute("data-theme", resolved);
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Update theme-color meta tag
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", resolved === "dark" ? "#171717" : "#FAF9F6");
  }
}

export const useThemeStore = create((set, get) => {
  // Initial theme default: 'light'
  let initialTheme = "light";
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("webfashion_theme");
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        initialTheme = saved;
      }
    } catch (e) {}
    // Synchronize DOM on script load
    applyThemeToDom(initialTheme);

    // Listen to system theme changes if in 'system' mode
    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          if (get().theme === "system") {
            applyThemeToDom("system");
          }
        });
    }
  }

  return {
    theme: initialTheme, // 'light' | 'dark' | 'system'
    getResolvedTheme: () => {
      const current = get().theme;
      return current === "system" ? getSystemTheme() : current;
    },
    setTheme: (newTheme) => {
      if (newTheme !== "light" && newTheme !== "dark" && newTheme !== "system") return;
      try {
        localStorage.setItem("webfashion_theme", newTheme);
      } catch (e) {}
      applyThemeToDom(newTheme);
      set({ theme: newTheme });
    },
    toggleTheme: () => {
      const current = get().getResolvedTheme();
      const nextTheme = current === "dark" ? "light" : "dark";
      get().setTheme(nextTheme);
    },
  };
});
