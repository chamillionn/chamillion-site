"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  PortfolioSummary,
  PositionEnriched,
  TradeEnriched,
  Snapshot,
  Platform,
  Strategy,
} from "@/lib/supabase/types";
import styles from "./cartera.module.css";

/* ── Helpers ── */

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pnlClass(value: number): string {
  if (value > 0) return styles.green;
  if (value < 0) return styles.red;
  return "";
}

function sideLabel(side: string): string {
  const map: Record<string, string> = {
    buy: "Compra",
    sell: "Venta",
    open_long: "Long",
    open_short: "Short",
    close_long: "Cerrar Long",
    close_short: "Cerrar Short",
  };
  return map[side] ?? side;
}

/* ── Components ── */

interface Props {
  summary: PortfolioSummary | null;
  positions: PositionEnriched[];
  trades: TradeEnriched[];
  snapshots: Snapshot[];
  platforms: Platform[];
  strategies: Strategy[];
}

type Tab = "posiciones" | "trades" | "rendimiento";

export default function CarteraClient({
  summary,
  positions,
  trades,
  snapshots,
  platforms,
  strategies,
}: Props) {
  const [tab, setTab] = useState<Tab>("posiciones");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [liveTrades, setLiveTrades] = useState<TradeEnriched[]>(trades);

  // Realtime: subscribe to new trades
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("trades-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trades" },
        async (payload) => {
          // Fetch the enriched version (with platform_name)
          const { data } = await supabase
            .from("trades_enriched")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setLiveTrades((prev) => [data as TradeEnriched, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPositions =
    platformFilter === "all"
      ? positions
      : positions.filter((p) => p.platform_name === platformFilter);

  const filteredTrades =
    platformFilter === "all"
      ? liveTrades
      : liveTrades.filter((t) => t.platform_name === platformFilter);

  // Group positions by strategy
  const byStrategy = new Map<string, PositionEnriched[]>();
  for (const p of filteredPositions) {
    const key = p.strategy_name ?? "Sin estrategia";
    if (!byStrategy.has(key)) byStrategy.set(key, []);
    byStrategy.get(key)!.push(p);
  }

  // Unique platform names that have active positions or trades
  const activePlatforms = [
    ...new Set([
      ...positions.map((p) => p.platform_name).filter(Boolean),
      ...trades.map((t) => t.platform_name).filter(Boolean),
    ]),
  ] as string[];

  return (
    <div className={`page-transition ${styles.page}`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Cartera</h1>
          <p className={styles.subtitle}>
            Posiciones, operaciones y rendimiento en tiempo real.
          </p>
        </div>
      </header>

      {/* ── Summary strip ── */}
      {summary && (
        <div className={styles.strip}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Valor</span>
            <span className={styles.metricValue}>
              {fmt(summary.total_value, 0)}€
            </span>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Coste</span>
            <span className={styles.metricValue}>
              {fmt(summary.total_cost, 0)}€
            </span>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>PnL</span>
            <span
              className={`${styles.metricValue} ${pnlClass(summary.total_pnl)}`}
            >
              {summary.total_pnl >= 0 ? "+" : ""}
              {fmt(summary.total_pnl, 0)}€
            </span>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>ROI</span>
            <span
              className={`${styles.metricValue} ${pnlClass(summary.total_roi_pct)}`}
            >
              {summary.total_roi_pct >= 0 ? "+" : ""}
              {fmt(summary.total_roi_pct, 1)}%
            </span>
          </div>
        </div>
      )}

      {/* ── Tabs + filter ── */}
      <div className={styles.controls}>
        <div className={styles.tabs}>
          {(["posiciones", "trades", "rendimiento"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            >
              {t === "posiciones"
                ? `Posiciones (${filteredPositions.length})`
                : t === "trades"
                  ? `Trades (${filteredTrades.length})`
                  : "Rendimiento"}
            </button>
          ))}
        </div>

        {activePlatforms.length > 1 && (
          <select
            className={styles.filter}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">Todas las plataformas</option>
            {activePlatforms.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Tab content ── */}
      <div className={styles.content}>
        {tab === "posiciones" && (
          <PositionsTab
            positions={filteredPositions}
            byStrategy={byStrategy}
          />
        )}
        {tab === "trades" && <TradesTab trades={filteredTrades} />}
        {tab === "rendimiento" && <RendimientoTab snapshots={snapshots} />}
      </div>
    </div>
  );
}

/* ── Positions tab ── */

function PositionsTab({
  positions,
  byStrategy,
}: {
  positions: PositionEnriched[];
  byStrategy: Map<string, PositionEnriched[]>;
}) {
  if (positions.length === 0) {
    return <p className={styles.empty}>No hay posiciones activas.</p>;
  }

  return (
    <div className={styles.positionsGrid}>
      {[...byStrategy.entries()].map(([strategyName, stratPositions]) => (
        <section key={strategyName} className={styles.strategyGroup}>
          <h3 className={styles.strategyLabel}>{strategyName}</h3>
          <div className={styles.table}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
              <span>Activo</span>
              <span>Plataforma</span>
              <span className={styles.right}>Tamaño</span>
              <span className={styles.right}>Valor</span>
              <span className={styles.right}>PnL</span>
              <span className={styles.right}>%</span>
            </div>
            {stratPositions.map((p) => (
              <div key={p.id} className={styles.tableRow}>
                <span className={styles.assetName}>{p.asset}</span>
                <span className={styles.dimText}>
                  {p.platform_name ?? "—"}
                </span>
                <span className={styles.right}>{fmt(p.size, 4)}</span>
                <span className={styles.right}>
                  {fmt(p.current_value, 0)}€
                </span>
                <span className={`${styles.right} ${pnlClass(p.pnl)}`}>
                  {p.pnl >= 0 ? "+" : ""}
                  {fmt(p.pnl, 0)}€
                </span>
                <span className={`${styles.right} ${pnlClass(p.roi_pct)}`}>
                  {p.roi_pct >= 0 ? "+" : ""}
                  {fmt(p.roi_pct, 1)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ── Trades tab ── */

function TradesTab({ trades }: { trades: TradeEnriched[] }) {
  if (trades.length === 0) {
    return <p className={styles.empty}>No hay trades registrados.</p>;
  }

  return (
    <div className={styles.table}>
      <div className={`${styles.tableRow} ${styles.tableHeader}`}>
        <span>Fecha</span>
        <span>Activo</span>
        <span>Lado</span>
        <span>Plataforma</span>
        <span className={styles.right}>Cantidad</span>
        <span className={styles.right}>Precio</span>
        <span className={styles.right}>Total</span>
      </div>
      {trades.map((t) => (
        <div key={t.id} className={styles.tableRow}>
          <span className={styles.dimText}>{fmtDateTime(t.executed_at)}</span>
          <span className={styles.assetName}>{t.asset}</span>
          <span
            className={
              t.side.includes("buy") || t.side.includes("long")
                ? styles.green
                : styles.red
            }
          >
            {sideLabel(t.side)}
          </span>
          <span className={styles.dimText}>{t.platform_name ?? "—"}</span>
          <span className={styles.right}>{fmt(t.quantity, 2)}</span>
          <span className={styles.right}>${fmt(t.price, 4)}</span>
          <span className={styles.right}>
            {fmt(t.total_value_eur ?? t.total_value, 0)}€
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Rendimiento tab ── */

function RendimientoTab({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) {
    return <p className={styles.empty}>Se necesitan al menos 2 días de datos para el gráfico.</p>;
  }

  // Reverse to chronological order for the chart
  const sorted = [...snapshots].reverse();
  const values = sorted.map((s) => s.total_value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 800;
  const H = 200;
  const padY = 16;

  const points = sorted
    .map((s, i) => {
      const x = (i / (sorted.length - 1)) * W;
      const y = padY + (1 - (s.total_value - min) / range) * (H - 2 * padY);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `M0,${H} L${points
    .split(" ")
    .map((p, i) => (i === 0 ? p : `L${p}`))
    .join(" ")} L${W},${H}Z`;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartHeader}>
        <span className={styles.chartLabel}>Valor del portfolio</span>
        <span className={styles.chartRange}>
          {fmtDate(sorted[0].snapshot_date)} — {fmtDate(sorted[sorted.length - 1].snapshot_date)}
        </span>
      </div>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--steel-blue)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--steel-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--steel-blue)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className={styles.chartFooter}>
        <span>{fmt(min, 0)}€</span>
        <span>{fmt(max, 0)}€</span>
      </div>
    </div>
  );
}
