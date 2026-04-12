"use client";

import { useEffect, useState } from "react";

const SUN = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="5.64" y1="5.64" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="18.36" y2="18.36" />
    <line x1="5.64" y1="18.36" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="18.36" y2="5.64" />
  </svg>
);

const MOON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chamillion-theme");
    const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial as "dark" | "light");
    setMounted(true);

    // Sync when keyboard shortcut changes theme
    function onStorage(e: StorageEvent) {
      if (e.key === "chamillion-theme" && e.newValue) {
        setTheme(e.newValue as "dark" | "light");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chamillion-theme", theme);

    // Sync meta theme-color with current theme
    const themeColor = theme === "dark" ? "#0C0E11" : "#e2d5c3";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", themeColor);

    // Sync with embedded iframes (restrict to same origin)
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        f.contentWindow?.postMessage({ type: "chamillion-theme", theme }, window.location.origin);
      } catch {
        // Cross-origin iframes will throw — ignore silently
      }
    });
  }, [theme, mounted]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    const apply = () => {
      // Set attribute synchronously so the View Transition captures the new state
      document.documentElement.setAttribute("data-theme", next);
      setTheme(next);
    };
    if (!document.startViewTransition) {
      apply();
      return;
    }
    document.startViewTransition(apply);
  }

  if (!mounted) return <button aria-label="Cambiar tema" style={{ width: 32, height: 32, background: "none", border: "none" }} />;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        transition: "color 0.2s",
        padding: 0,
      }}
    >
      {theme === "dark" ? SUN : MOON}
    </button>
  );
}
