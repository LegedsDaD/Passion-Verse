"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-10 w-10 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
      title={`Switch to ${nextTheme} mode`}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-indigo-600 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
