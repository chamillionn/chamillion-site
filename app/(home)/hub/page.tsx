"use client";

import { useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import styles from "./page.module.css";

const FEATURES = [
  { icon: "M4 20V10M9 20V6M14 20v-8M19 20V4", label: "Cartera a tiempo real" },
  { icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 8v4M12 16h.01", label: "Glosario desde cero" },
  { icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z", label: "Mapa de conocimientos" },
  { icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", label: "Comunidad" },
];

export default function HubPage() {
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty("--accent", "#50c878");
    s.setProperty("--accent-r", "80");
    s.setProperty("--accent-g", "200");
    s.setProperty("--accent-b", "120");
    return () => {
      s.setProperty("--accent", "#6b8cae");
      s.setProperty("--accent-r", "107");
      s.setProperty("--accent-g", "140");
      s.setProperty("--accent-b", "174");
    };
  }, []);

  return (
    <div className={`page-transition ${styles.page}`}>
      <div className={styles.toggleWrap}>
        <ThemeToggle />
      </div>
      <div className={styles.content}>
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          En construcción
        </span>

        <h1 className={styles.heading}>Hub</h1>

        <div className={styles.features}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.feature}>
              <svg
                className={styles.featureIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={f.icon} />
              </svg>
              <span className={styles.featureLabel}>{f.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        <p className={styles.subtitle}>Próximamente.</p>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            &larr; Inicio
          </Link>
          <span className={styles.navDot}>&middot;</span>
          <Link href="/newsletter" className={styles.navLink}>
            Newsletter &rarr;
          </Link>
        </nav>
      </div>
    </div>
  );
}
