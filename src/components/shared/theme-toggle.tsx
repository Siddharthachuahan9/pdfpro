"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

/** A plain word, not an icon: it says which theme a press will switch to. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // false during the server render and hydration, true afterwards: the theme is only known in the browser
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {mounted ? (dark ? "Light" : "Dark") : "Theme"}
    </button>
  );
}
