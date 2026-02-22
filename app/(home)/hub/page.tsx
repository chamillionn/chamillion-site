"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const FEATURES = [
  { icon: "M4 20V10M9 20V6M14 20v-8M19 20V4", label: "Cartera a tiempo real" },
  { icon: "M3 12h4l3-9 4 18 3-9h4", label: "Tracking de posiciones" },
  { icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 6v4l3 3", label: "Métricas y estadísticas" },
  { icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z", label: "Mapa de conocimientos" },
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
      <div className={styles.content}>
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          En construcción
        </span>

        <h1 className={styles.heading}>Hub</h1>

        <p className={styles.description}>
          Operaciones a tiempo real, posiciones, métricas y un mapa de conocimientos.
          Todo en un solo sitio.
        </p>

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
