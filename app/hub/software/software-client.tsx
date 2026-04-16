"use client";

import { useState } from "react";
import type { SoftwareWithLatest } from "@/lib/supabase/types";
import styles from "./software.module.css";

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  bot: "Bot",
  tool: "Herramienta",
  strategy: "Estrategia",
  template: "Template",
};

interface Props {
  items: SoftwareWithLatest[];
}

export default function SoftwareClient({ items }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleDownload(versionId: string) {
    setDownloading(versionId);
    try {
      const res = await fetch("/api/software/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } finally {
      setDownloading(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className={`page-transition ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Software</h1>
          <p className={styles.subtitle}>
            Robots y herramientas descargables para estrategias de inversión.
          </p>
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyText}>No hay software disponible todavía.</p>
          <p className={styles.emptyHint}>Las herramientas aparecerán aquí conforme se vayan publicando.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-transition ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Software</h1>
        <p className={styles.subtitle}>
          Robots y herramientas descargables para estrategias de inversión.
        </p>
      </header>

      <div className={styles.list}>
        {items.map((item) => (
          <article key={item.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {item.category && (
                  <span className={styles.itemCategory}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                )}
              </div>
              {item.latest_version && (
                <span className={styles.itemVersion}>v{item.latest_version}</span>
              )}
            </div>

            {item.description && (
              <p className={styles.itemDesc}>{item.description}</p>
            )}

            {item.latest_release_notes && (
              <p className={styles.itemNotes}>{item.latest_release_notes}</p>
            )}

            <div className={styles.itemFooter}>
              <div className={styles.itemMeta}>
                <span>{formatDate(item.latest_released_at)}</span>
                <span>{formatSize(item.latest_file_size)}</span>
              </div>
              {item.latest_version_id && (
                <button
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(item.latest_version_id!)}
                  disabled={downloading === item.latest_version_id}
                >
                  {downloading === item.latest_version_id ? (
                    <span className={styles.spinner} />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  Descargar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
