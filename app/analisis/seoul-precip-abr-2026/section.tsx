"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./section.module.css";

interface Props {
  id: string;
  eyebrow?: string;
  /** Ordinal displayed before the title (e.g., "01 · El mercado") — optional */
  label?: string;
  title: string;
  children: React.ReactNode;
}

/**
 * Section wrapper — editorial rhythm with a single reveal on scroll in.
 * No pills, no dividers; just breathing space and a whispered eyebrow.
 */
export default function AnalysisSection({
  id,
  eyebrow,
  label,
  title,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          ob.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`${styles.section} ${visible ? styles.visible : ""}`}
    >
      <header className={styles.header}>
        {(eyebrow || label) && (
          <div className={styles.meta}>
            {label && <span className={styles.label}>{label}</span>}
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          </div>
        )}
        <h2 className={styles.title}>{title}</h2>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
