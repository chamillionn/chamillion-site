"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress bar at the top of the viewport during route transitions.
 * Detects pathname changes: when the pathname changes, the bar completes
 * its animation to 100% and fades out.
 *
 * Since Next.js App Router doesn't expose routeChangeStart events,
 * we use a click listener on internal links to start the bar, and
 * pathname change to complete it.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "complete">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Listen for clicks on internal links to start the progress bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;

      // Same page — ignore
      if (href === pathname) return;

      // Start loading
      setState("loading");
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // When pathname actually changes → complete the bar
  useEffect(() => {
    if (state === "loading") {
      setState("complete");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setState("idle"), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Clean up timeout
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (state === "idle") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          background: "var(--steel-blue)",
          transformOrigin: "left",
          transition:
            state === "loading"
              ? "transform 8s cubic-bezier(0.1, 0.5, 0.1, 1)"
              : "transform 0.3s ease-out, opacity 0.4s ease-out 0.1s",
          transform:
            state === "loading"
              ? "scaleX(0.7)"
              : "scaleX(1)",
          opacity: state === "complete" ? 0 : 1,
        }}
      />
    </div>
  );
}
