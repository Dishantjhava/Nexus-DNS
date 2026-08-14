"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("nexus_dns_theme");
      return (saved === "dark" || saved === "light") ? saved : "light";
    } catch {
      return "light";
    }
  });

  const applyThemeMode = (mode: ThemeMode) => {
    if (typeof document === "undefined") return;

    const isDark = mode === "dark";
    
    // Apply Cloudscape native dark mode
    applyMode(isDark ? Mode.Dark : Mode.Light, document.documentElement);
    applyMode(isDark ? Mode.Dark : Mode.Light, document.body);

    if (isDark) {
      document.documentElement.classList.add("dark", "awsui-dark-mode");
      document.body.classList.add("dark", "awsui-dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark", "awsui-dark-mode");
      document.body.classList.remove("dark", "awsui-dark-mode");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  useEffect(() => {
    applyThemeMode(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeState(next);
    try {
      localStorage.setItem("nexus_dns_theme", next);
    } catch {
      // ignore
    }
    applyThemeMode(next);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem("nexus_dns_theme", mode);
    } catch {
      // ignore
    }
    applyThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
