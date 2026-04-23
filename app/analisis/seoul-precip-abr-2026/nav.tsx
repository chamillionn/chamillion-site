"use client";

import { useEffect, useState } from "react";
import styles from "./nav.module.css";

export interface NavSection {
  id: string;
  label: string;
}

interface Props {
  sections: NavSection[];
}

/**
 * Sticky side rail with progress highlighting which section is in viewport.
 * Collapses on narrow screens (hidden below 1100px).
 */
export default function AnalysisNav({ sections }: Props) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((s) => ({ id: s.id, el: document.getElementById(s.id) }))
      .filter((x): x is { id: string; el: HTMLElement } => x.el !== null);

    if (elements.length === 0) return;

    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActive(id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.01 },
    );

    elements.forEach(({ el }) => ob.observe(el));

    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, scrolled / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ob.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sections]);

  return (
    <nav className={styles.rail} aria-label="Sección">
      <div className={styles.track}>
        <div
          className={styles.trackFill}
          style={{ transform: `scaleY(${progress})` }}
        />
      </div>
      <ul className={styles.list}>
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`${styles.item} ${active === s.id ? styles.active : ""}`}
            >
              <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.label}>{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
