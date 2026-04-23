"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "@/lib/analisis/glossary";
import styles from "./term.module.css";

interface Props {
  slug: string;
  children?: React.ReactNode;
}

/**
 * Inline term with a portal-rendered hover/focus card explaining the concept.
 * - Reads definition from lib/analisis/glossary.ts
 * - Accessible: triggers on hover AND keyboard focus, ESC closes.
 * - Tooltip is portaled to document.body so overflow clipping can't hide it.
 */
export default function Term({ slug, children }: Props) {
  const entry = GLOSSARY[slug];
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const compute = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 10;
    const tooltipWidth = 320;
    const tooltipEstimatedHeight = 180;

    const spaceAbove = rect.top;
    const placement: "top" | "bottom" =
      spaceAbove > tooltipEstimatedHeight + gap ? "top" : "bottom";

    const centerX = rect.left + rect.width / 2;
    const leftRaw = centerX - tooltipWidth / 2;
    const left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, leftRaw));

    const top =
      placement === "top"
        ? rect.top + window.scrollY - gap
        : rect.bottom + window.scrollY + gap;

    setPos({ top, left, placement });
  }, []);

  useEffect(() => {
    if (!open) return;
    compute();
    const onScroll = () => compute();
    const onResize = () => compute();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, compute]);

  if (!entry) {
    // Fallback: render children as-is if slug unknown (prevents build breakage).
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<Term slug="${slug}"> not found in glossary`);
    }
    return <>{children ?? slug}</>;
  }

  const label = children ?? entry.term;

  return (
    <>
      <span
        ref={triggerRef}
        className={styles.trigger}
        tabIndex={0}
        role="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        {label}
      </span>
      {mounted && open && pos &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={`${styles.tooltip} ${styles[`place-${pos.placement}`]}`}
            style={{
              top: pos.top,
              left: pos.left,
            }}
          >
            <div className={styles.tooltipHead}>
              <span className={styles.tooltipTerm}>{entry.term}</span>
              {entry.full && <span className={styles.tooltipFull}>· {entry.full}</span>}
              {entry.category && (
                <span className={styles.tooltipCategory}>{entry.category}</span>
              )}
            </div>
            <p className={styles.tooltipDef}>{entry.def}</p>
            {entry.long && <p className={styles.tooltipLong}>{entry.long}</p>}
            {entry.sourceUrl && (
              <a
                className={styles.tooltipSource}
                href={entry.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {entry.sourceName ?? "Fuente"} ↗
              </a>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
