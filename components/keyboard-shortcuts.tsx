"use client";

import { useEffect } from "react";

export default function KeyboardShortcuts() {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case "t": {
          // Toggle theme
          const current = document.documentElement.getAttribute("data-theme") || "dark";
          const next = current === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", next);
          localStorage.setItem("chamillion-theme", next);
          // Update meta theme-color
          const color = next === "dark" ? "#0C0E11" : "#e2d5c3";
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", color);
          // Sync iframes
          document.querySelectorAll("iframe").forEach((f) => {
            try {
              f.contentWindow?.postMessage({ type: "chamillion-theme", theme: next }, window.location.origin);
            } catch { /* cross-origin */ }
          });
          // Dispatch storage event so ThemeToggle re-renders
          window.dispatchEvent(new StorageEvent("storage", { key: "chamillion-theme", newValue: next }));
          break;
        }
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return null;
}
