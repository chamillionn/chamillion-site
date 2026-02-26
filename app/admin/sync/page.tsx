"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface SyncResult {
  platform: string;
  updated: number;
  errors: string[];
  timestamp: string;
}

const PLATFORMS = [
  { id: "hyperliquid", label: "Hyperliquid", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "polymarket", label: "Polymarket", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 8v4M12 16h.01" },
];

export default function SyncPage() {
  const [results, setResults] = useState<Record<string, SyncResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  function toSyncResult(platformId: string, data: Record<string, unknown>): SyncResult {
    if (data.errors && Array.isArray(data.errors)) return data as unknown as SyncResult;
    // API returned an error shape like {error: "Unauthorized"}
    return {
      platform: platformId,
      updated: 0,
      errors: [String(data.error || "Error desconocido")],
      timestamp: new Date().toISOString(),
    };
  }

  async function syncPlatform(platformId: string) {
    setLoading((prev) => ({ ...prev, [platformId]: true }));

    try {
      const res = await fetch(`/api/sync/${platformId}`);
      const data = await res.json();
      setResults((prev) => ({ ...prev, [platformId]: toSyncResult(platformId, data) }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [platformId]: {
          platform: platformId,
          updated: 0,
          errors: [e instanceof Error ? e.message : "Error de conexión"],
          timestamp: new Date().toISOString(),
        },
      }));
    }

    setLoading((prev) => ({ ...prev, [platformId]: false }));
  }

  async function syncAll() {
    setSyncAllLoading(true);

    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      if (data.results) {
        const newResults: Record<string, SyncResult> = {};
        for (const r of data.results as SyncResult[]) {
          const key = r.platform?.toLowerCase() ?? "unknown";
          newResults[key] = toSyncResult(key, r as unknown as Record<string, unknown>);
        }
        setResults(newResults);
      }
    } catch (e) {
      console.error("Sync all failed:", e);
    }

    setSyncAllLoading(false);
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.heading}>Sync</h1>
        <button
          onClick={syncAll}
          disabled={syncAllLoading}
          className={styles.syncAllBtn}
        >
          {syncAllLoading ? "Sincronizando..." : "Sync All"}
        </button>
      </div>

      <p className={styles.description}>
        Sincroniza posiciones desde APIs externas. Cada plataforma consulta tu
        wallet y actualiza las posiciones en la base de datos.
      </p>

      <div className={styles.grid}>
        {PLATFORMS.map((p) => {
          const result = results[p.id];
          const isLoading = loading[p.id] || syncAllLoading;
          const hasError = result && result.errors.length > 0;
          const hasSuccess = result && result.errors.length === 0;

          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.cardIcon}
                >
                  <path d={p.icon} />
                </svg>
                <span className={styles.cardTitle}>{p.label}</span>
              </div>

              {result && (
                <div className={styles.resultBox}>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Actualizadas</span>
                    <span className={styles.resultValue}>{result.updated}</span>
                  </div>
                  {result.errors.length > 0 && (
                    <div className={styles.resultErrors}>
                      {result.errors.map((e, i) => (
                        <p key={i} className={styles.errorLine}>
                          {e}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className={styles.timestamp}>
                    {new Date(result.timestamp).toLocaleString("es-ES")}
                  </p>
                </div>
              )}

              <button
                onClick={() => syncPlatform(p.id)}
                disabled={isLoading}
                className={`${styles.syncBtn} ${hasSuccess ? styles.syncBtnSuccess : ""} ${hasError ? styles.syncBtnError : ""}`}
              >
                {isLoading ? (
                  "Sincronizando..."
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 4v6h6M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                    </svg>
                    Sync
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
