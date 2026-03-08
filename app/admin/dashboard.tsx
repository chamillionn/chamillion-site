"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Platform, PositionEnriched, PortfolioSummary, Snapshot } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { KNOWN_PLATFORMS } from "@/lib/platforms/presets";
import styles from "./page.module.css";

interface SyncResult {
  platform: string;
  updated: number;
  deactivated: number;
  errors: string[];
  timestamp: string;
}

interface Props {
  summary: PortfolioSummary | null;
  positions: PositionEnriched[];
  platforms: Platform[];
  prevSnapshot: Snapshot | null;
}

export default function Dashboard({ summary, positions, platforms, prevSnapshot }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<Record<string, {
    loading: boolean;
    result: SyncResult | null;
  }>>({});
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  const hasData = summary && summary.total_value != null;
  const activePositions = positions.filter(
    (p) => !("is_active" in p) || (p as unknown as { is_active: boolean }).is_active !== false,
  );

  const fmt = (n: number) =>
    `${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}€`;

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

  // Syncable platforms (for "Sync All")
  const syncableSlugs = platforms
    .map((p) => KNOWN_PLATFORMS.find((k) => k.name === p.name))
    .filter((k) => k?.syncable)
    .map((k) => k!.slug);

  const anySyncing = syncAllLoading || Object.values(syncState).some((s) => s.loading);

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
          deactivated: 0,
          errors: [String(data.error || "Error desconocido")],
          timestamp: new Date().toISOString(),
        };
      setSyncState((prev) => ({ ...prev, [slug]: { loading: false, result } }));

      if (result.errors.length > 0) toast(result.errors[0], "error");
      else toast(`${slug}: ${result.updated} actualizadas`, "success");

      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de conexion";
      setSyncState((prev) => ({
        ...prev,
        [slug]: {
          loading: false,
          result: {
            platform: slug,
            updated: 0,
            deactivated: 0,
            errors: [msg],
            timestamp: new Date().toISOString(),
          },
        },
      }));
      toast(msg, "error");
    }
  }

  async function handleSyncAll() {
    setSyncAllLoading(true);

    try {
      const res = await fetch("/api/sync");
      const data = await res.json();

      if (data.results) {
        const newState: typeof syncState = {};
        let totalUpdated = 0;
        let totalErrors = 0;

        for (const r of data.results as SyncResult[]) {
          const key = r.platform?.toLowerCase() ?? "unknown";
          newState[key] = { loading: false, result: r };
          totalUpdated += r.updated;
          totalErrors += r.errors.length;
        }
        setSyncState(newState);

        if (totalErrors > 0) toast(`Sync: ${totalUpdated} ok, ${totalErrors} errores`, "error");
        else toast(`Sync completo: ${totalUpdated} posiciones actualizadas`, "success");
      }

      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error de conexion", "error");
    }

    setSyncAllLoading(false);
  }

  // Delta calculations (current vs previous snapshot)
  const prev = prevSnapshot;
  const prevPnl = prev ? prev.total_value - prev.total_cost : null;
  const prevRoi = prev && prev.total_cost > 0 ? ((prev.total_value - prev.total_cost) / prev.total_cost) * 100 : null;

  function delta(current: number | undefined, previous: number | null): string | null {
    if (current == null || previous == null) return null;
    const d = current - previous;
    if (Math.abs(d) < 0.01) return null;
    return `${d >= 0 ? "+" : ""}${fmt(d)}`;
  }

  function deltaPct(current: number | undefined, previous: number | null): string | null {
    if (current == null || previous == null) return null;
    const d = current - previous;
    if (Math.abs(d) < 0.01) return null;
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}pp`;
  }

  const stats = [
    {
      label: "Valor total",
      value: hasData ? fmt(summary.total_value) : "—",
      delta: hasData ? delta(summary.total_value, prev?.total_value ?? null) : null,
    },
    {
      label: "Coste total",
      value: hasData ? fmt(summary.total_cost) : "—",
      delta: hasData ? delta(summary.total_cost, prev?.total_cost ?? null) : null,
    },
    {
      label: "PnL",
      value: hasData ? `${summary.total_pnl >= 0 ? "+" : ""}${fmt(summary.total_pnl)}` : "—",
      color: hasData ? (summary.total_pnl >= 0 ? "var(--green)" : "var(--red)") : undefined,
      delta: hasData ? delta(summary.total_pnl, prevPnl) : null,
    },
    {
      label: "ROI",
      value: hasData ? `${summary.total_roi_pct >= 0 ? "+" : ""}${summary.total_roi_pct.toFixed(1)}%` : "—",
      color: hasData ? (summary.total_roi_pct >= 0 ? "var(--green)" : "var(--red)") : undefined,
      delta: hasData ? deltaPct(summary.total_roi_pct, prevRoi) : null,
    },
    {
      label: "Posiciones",
      value: `${activePositions.length}`,
      delta: prev?.positions_data ? `${activePositions.length - prev.positions_data.length >= 0 ? "+" : ""}${activePositions.length - prev.positions_data.length}` : null,
    },
  ];

  return (
    <div>
      {/* Header with title + sync all */}
      <div className={styles.dashHeader}>
        <h1 className={styles.heading}>Dashboard</h1>
        {syncableSlugs.length > 0 && (
          <button
            onClick={handleSyncAll}
            disabled={anySyncing}
            className={styles.syncAllBtn}
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
              className={anySyncing ? styles.syncSpin : ""}
            >
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            {syncAllLoading ? "Sincronizando..." : "Sync All"}
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className={styles.grid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue} style={s.color ? { color: s.color } : undefined}>
              {s.value}
            </span>
            {s.delta && (
              <span
                className={styles.statDelta}
                style={{ color: s.delta.startsWith("+") ? "var(--green)" : "var(--red)" }}
              >
                {s.delta.startsWith("+") ? "▲" : "▼"} {s.delta}
              </span>
            )}
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
                    viewBox={preset.iconViewBox ?? "0 0 24 24"}
                    fill="currentColor"
                    className={styles.platformIcon}
                  >
                    <path d={preset.icon} fillRule={preset.iconFillRule} />
                  </svg>
                )}
                <span className={styles.platformName}>{platform.name}</span>
                <span className={styles.posCount}>{platformPositions.length}</span>
                {profileHref && profileHref !== "#" && (
                  <a
                    href={profileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.profileLink}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                )}
              </div>

              {slug && preset?.syncable && (
                <div className={styles.syncArea}>
                  {sync?.result && !sync.loading && (
                    <span
                      className={sync.result.errors.length > 0 ? styles.syncError : styles.syncSuccess}
                      title={sync.result.errors.length > 0 ? sync.result.errors.join("\n") : undefined}
                    >
                      {sync.result.errors.length > 0
                        ? sync.result.errors[0]
                        : `${sync.result.updated} ok${sync.result.deactivated > 0 ? `, ${sync.result.deactivated} cerradas` : ""}`}
                    </span>
                  )}
                  <button
                    onClick={() => handleSync(slug)}
                    disabled={sync?.loading || syncAllLoading}
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
                    {sync?.loading ? "..." : "Sync"}
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
              <span className={styles.platformName}>Sin plataforma</span>
              <span className={styles.posCount}>{unassigned.length}</span>
            </div>
          </div>
          <PositionsTable positions={unassigned} />
        </section>
      )}

      {activePositions.length === 0 && (
        <div className={styles.empty}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>No hay posiciones activas</p>
          <p>
            Ve a <Link href="/admin/platforms" style={{ color: "var(--steel-blue)" }}>Plataformas</Link> para
            añadir una y sincronizar, o
            a <Link href="/admin/positions" style={{ color: "var(--steel-blue)" }}>Posiciones</Link> para añadir manualmente.
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
            <th className={`${styles.right} ${styles.hideMobile}`}>Size</th>
            <th className={styles.right}>Valor</th>
            <th className={`${styles.right} ${styles.hideMobile}`}>Coste</th>
            <th className={styles.right}>PnL</th>
            <th className={styles.right}>ROI</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id}>
              <td className={styles.bold}>{p.asset}</td>
              <td className={`${styles.right} ${styles.hideMobile}`}>{p.size.toLocaleString("en-US")}</td>
              <td className={styles.right}>
                {p.current_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}€
              </td>
              <td className={`${styles.right} ${styles.hideMobile}`}>
                {p.cost_basis.toLocaleString("en-US", { minimumFractionDigits: 2 })}€
              </td>
              <td
                className={styles.right}
                style={{ color: p.pnl >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {p.pnl >= 0 ? "+" : ""}
                {p.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}€
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
