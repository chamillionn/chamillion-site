"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform, PositionEnriched, PortfolioSummary } from "@/lib/supabase/types";
import { KNOWN_PLATFORMS } from "@/lib/platforms/presets";
import styles from "./page.module.css";

interface SyncResult {
  platform: string;
  updated: number;
  errors: string[];
  timestamp: string;
}

interface Props {
  summary: PortfolioSummary | null;
  positions: PositionEnriched[];
  platforms: Platform[];
}

export default function Dashboard({ summary, positions, platforms }: Props) {
  const router = useRouter();
  const [syncState, setSyncState] = useState<Record<string, {
    loading: boolean;
    result: SyncResult | null;
  }>>({});

  const hasData = summary && summary.total_value != null;
  const activePositions = positions.filter(
    (p) => !("is_active" in p) || (p as unknown as { is_active: boolean }).is_active !== false,
  );

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  // Group positions by platform_id
  const platformMap = new Map<string | null, PositionEnriched[]>();
  for (const p of activePositions) {
    const key = p.platform_id;
    if (!platformMap.has(key)) platformMap.set(key, []);
    platformMap.get(key)!.push(p);
  }

  // Order: known platforms first, then others, then null
  const platformOrder = platforms
    .filter((pl) => platformMap.has(pl.id))
    .sort((a, b) => {
      const aKnown = KNOWN_PLATFORMS.some((k) => k.name === a.name);
      const bKnown = KNOWN_PLATFORMS.some((k) => k.name === b.name);
      if (aKnown && !bKnown) return -1;
      if (!aKnown && bKnown) return 1;
      return a.name.localeCompare(b.name);
    });

  const unassigned = platformMap.get(null) ?? [];

  async function handleSync(slug: string) {
    setSyncState((prev) => ({
      ...prev,
      [slug]: { loading: true, result: null },
    }));

    try {
      const res = await fetch(`/api/sync/${slug}`);
      const data = await res.json();
      const result: SyncResult = data.errors && Array.isArray(data.errors)
        ? data
        : {
          platform: slug,
          updated: 0,
          errors: [String(data.error || "Error desconocido")],
          timestamp: new Date().toISOString(),
        };
      setSyncState((prev) => ({ ...prev, [slug]: { loading: false, result } }));
      router.refresh();
    } catch (e) {
      setSyncState((prev) => ({
        ...prev,
        [slug]: {
          loading: false,
          result: {
            platform: slug,
            updated: 0,
            errors: [e instanceof Error ? e.message : "Error de conexión"],
            timestamp: new Date().toISOString(),
          },
        },
      }));
    }
  }

  const stats = [
    { label: "Valor total", value: hasData ? fmt(summary.total_value) : "—" },
    { label: "Coste total", value: hasData ? fmt(summary.total_cost) : "—" },
    {
      label: "PnL",
      value: hasData ? `${summary.total_pnl >= 0 ? "+" : ""}${fmt(summary.total_pnl)}` : "—",
      color: hasData ? (summary.total_pnl >= 0 ? "var(--green)" : "var(--red)") : undefined,
    },
    {
      label: "ROI",
      value: hasData ? `${summary.total_roi_pct >= 0 ? "+" : ""}${summary.total_roi_pct.toFixed(1)}%` : "—",
      color: hasData ? (summary.total_roi_pct >= 0 ? "var(--green)" : "var(--red)") : undefined,
    },
  ];

  return (
    <div>
      <h1 className={styles.heading}>Dashboard</h1>

      {/* Stats grid */}
      <div className={styles.grid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue} style={s.color ? { color: s.color } : undefined}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Platform sections */}
      {platformOrder.map((platform) => {
        const preset = KNOWN_PLATFORMS.find((k) => k.name === platform.name);
        const slug = preset?.slug;
        const sync = slug ? syncState[slug] : undefined;
        const platformPositions = platformMap.get(platform.id) ?? [];
        const profileHref = preset && platform.wallet_address
          ? preset.profileUrl(platform.wallet_address)
          : platform.url;

        return (
          <section key={platform.id} className={styles.platformSection}>
            <div className={styles.platformHeader}>
              <div className={styles.platformTitle}>
                {preset && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.platformIcon}
                  >
                    <path d={preset.icon} />
                  </svg>
                )}
                <span className={styles.platformName}>{platform.name}</span>
                {profileHref && (
                  <a
                    href={profileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.profileLink}
                  >
                    Ver perfil
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                )}
              </div>

              {slug && (
                <div className={styles.syncArea}>
                  {sync?.result && !sync.loading && (
                    <span className={sync.result.errors.length > 0 ? styles.syncError : styles.syncSuccess}>
                      {sync.result.errors.length > 0
                        ? sync.result.errors[0]
                        : `${sync.result.updated} actualizadas`}
                    </span>
                  )}
                  <button
                    onClick={() => handleSync(slug)}
                    disabled={sync?.loading}
                    className={styles.syncBtn}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={sync?.loading ? styles.syncSpin : ""}
                    >
                      <path d="M1 4v6h6M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                    </svg>
                    {sync?.loading ? "Syncing..." : "Sync"}
                  </button>
                </div>
              )}
            </div>

            <PositionsTable positions={platformPositions} />
          </section>
        );
      })}

      {/* Unassigned positions */}
      {unassigned.length > 0 && (
        <section className={styles.platformSection}>
          <div className={styles.platformHeader}>
            <div className={styles.platformTitle}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.platformIcon}
              >
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className={styles.platformName}>Otras posiciones</span>
            </div>
          </div>
          <PositionsTable positions={unassigned} />
        </section>
      )}

      {activePositions.length === 0 && (
        <div className={styles.empty}>
          <p>No hay posiciones activas.</p>
          <p>
            Ve a <strong>Plataformas</strong> para añadir una plataforma y sincronizar,
            o a <strong>Posiciones</strong> para añadir manualmente.
          </p>
        </div>
      )}
    </div>
  );
}

function PositionsTable({ positions }: { positions: PositionEnriched[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Asset</th>
            <th className={styles.right}>Size</th>
            <th className={styles.right}>Valor</th>
            <th className={styles.right}>Coste</th>
            <th className={styles.right}>PnL</th>
            <th className={styles.right}>ROI</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id}>
              <td className={styles.bold}>{p.asset}</td>
              <td className={styles.right}>{p.size.toLocaleString("en-US")}</td>
              <td className={styles.right}>
                ${p.current_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td className={styles.right}>
                ${p.cost_basis.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td
                className={styles.right}
                style={{ color: p.pnl >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {p.pnl >= 0 ? "+" : ""}
                ${p.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td
                className={styles.right}
                style={{ color: p.roi_pct >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {p.roi_pct >= 0 ? "+" : ""}
                {p.roi_pct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
