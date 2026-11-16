import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "deutschhub-catalogue-theme-v1";
const CatalogueThemeContext = createContext(null);

function initialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Kept independent of the rest of DeutschHub until a global theme is approved. */
export function CatalogueThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be disabled; the in-memory choice still works.
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <CatalogueThemeContext.Provider value={value}>
      {children}
    </CatalogueThemeContext.Provider>
  );
}

export function useCatalogueTheme() {
  const context = useContext(CatalogueThemeContext);
  const [fallbackTheme, setFallbackTheme] = useState(initialTheme);
  // Production uses the shared Provider; isolated route/unit tests can still render.
  return context || { theme: fallbackTheme, setTheme: setFallbackTheme };
}
