"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./post.module.css";

interface TocEntry {
  id: string;
  label: string;
  sub?: boolean;
  readTime?: number; // minutes for this section
}

export default function TocSidebar({ entries }: { entries: TocEntry[] }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter(Boolean) as HTMLElement[];

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (obs) => {
        for (const entry of obs) {
          if (entry.isIntersecting) {
            const idx = entries.findIndex((e) => e.id === entry.target.id);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    for (const h of headings) observer.observe(h);
    return () => observer.disconnect();
  }, [entries]);

  // Compute fill height based on node positions
  const nodeCount = entries.length;
  const fillPercent =
    activeIndex < 0 ? 0 : (activeIndex / Math.max(nodeCount - 1, 1)) * 100;

  // Remaining read time from active section onwards
  const remainingTime = (fromIndex: number) =>
    entries.slice(fromIndex).reduce((sum, e) => sum + (e.readTime ?? 0), 0);

  return (
    <nav className={styles.tocSidebar} aria-label="Tabla de contenidos">
      <div className={styles.tocTrack} ref={trackRef}>
        {/* Background line */}
        <div className={styles.tocTrackBg} />
        {/* Progress fill */}
        <div
          className={styles.tocTrackFill}
          style={{ height: `${fillPercent}%` }}
        />

        {/* Nodes */}
        {entries.map((e, i) => {
          const isPast = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <a
              key={e.id}
              href={`#${e.id}`}
              className={styles.tocNodeWrap}
              aria-label={e.label}
            >
              <span
                className={[
                  styles.tocNode,
                  e.sub ? styles.tocNodeSub : "",
                  isPast ? styles.tocNodePast : "",
                  isActive ? styles.tocNodeActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </a>
          );
        })}

        {/* Hover panel */}
        <div className={styles.tocPanel}>
          {entries.map((e, i) => {
            const isPast = i < activeIndex;
            const isActive = i === activeIndex;
            const mins = isPast ? 0 : remainingTime(i);
            return (
              <a key={e.id} href={`#${e.id}`} className={styles.tocRow}>
                <span
                  className={[
                    styles.tocRowLabel,
                    e.sub ? styles.tocRowLabelSub : "",
                    isPast ? styles.tocRowLabelPast : "",
                    isActive ? styles.tocRowLabelActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {e.label}
                </span>
                {isPast ? (
                  <span className={styles.tocRowCheck}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : mins > 0 ? (
                  <span className={styles.tocRowTime}>~{mins} min</span>
                ) : null}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
