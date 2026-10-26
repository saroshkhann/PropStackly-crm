"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "circular";
}

export function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${
          variant === "circular"
            ? "w-10 h-10 sm:w-11 sm:h-11 rounded-full"
            : "w-9 h-9 rounded-xl"
        } border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 animate-pulse ${className}`}
      />
    );
  }

  const isDark = theme === "dark";

  if (variant === "circular") {
    return (
      <button
        onClick={() => toggleTheme()}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        title={`Current: ${isDark ? "Dark Mode" : "Light Mode"} (Click to switch)`}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer ${className}`}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700 fill-slate-300/30" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        // Toggle theme immediately
        toggleTheme();
      }}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      title={`Current: ${isDark ? "Dark Mode" : "Light Mode"} (Click to switch)`}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-medium text-xs transition-all duration-200 cursor-pointer shadow-xs select-none ${
        isDark
          ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-amber-400/40"
          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
      } ${className}`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-spin-once" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600 fill-slate-300/30" />
        )}
      </span>
      <span className="hidden md:inline font-semibold text-[11px]">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
