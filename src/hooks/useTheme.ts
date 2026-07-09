import { useState, useEffect } from "react";
import type { Theme } from "../components/ThemeToggle";

/**
 * useTheme — Gerencia o tema claro/escuro.
 * Persiste no localStorage e aplica a classe `dark` no <html>.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("flowheart_theme") as Theme) ?? "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("flowheart_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, toggleTheme };
}