"use client";

import { useState, useRef } from "react";
import type { Snapshot } from "@/lib/supabase/types";
import styles from "./snapshots.module.css";

type Range = "7d" | "30d" | "90d" | "all";

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "all", label: "Todo" },
];

function filterByRange(data: Snapshot[], range: Range): Snapshot[] {
  if (range === "all") return data;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return data.filter((s) => new Date(s.snapshot_date) >= cutoff);
}

function fmtEur(n: number) {
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function fmtAxis(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

// SVG dimensions (viewBox-based, responsive)
const W = 800;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

export default function SnapshotChart({ snapshots }: { snapshots: Snapshot[] }) {
  const [range, setRange] = useState<Range>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Snapshots come newest first — reverse for chronological order
  const chronological = [...snapshots].reverse();
  const filtered = filterByRange(chronological, range);

  if (filtered.length < 2) {
    return (
      <div className={styles.chartWrap}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Evolución del portfolio</span>
          <div className={styles.chartFilters}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`${styles.chartFilterBtn} ${range === r.key ? styles.chartFilterBtnActive : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.chartEmpty}>
          Se necesitan al menos 2 snapshots para mostrar el gráfico.
        </div>
      </div>
    );
  }

  // Data ranges
  const allNums = filtered.flatMap((s) => [s.total_value, s.total_cost]);
  const dataMin = Math.min(...allNums);
  const dataMax = Math.max(...allNums);
  const padding = (dataMax - dataMin) * 0.08 || 1;
  const minY = dataMin - padding;
  const maxY = dataMax + padding;
  const rangeY = maxY - minY;

  // Map data to SVG coordinates
  const toX = (i: number) => PAD.left + (i / (filtered.length - 1)) * CHART_W;
  const toY = (v: number) => PAD.top + (1 - (v - minY) / rangeY) * CHART_H;

  // Build SVG paths
  const valuePath = filtered
    .map((s, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s.total_value).toFixed(1)}`)
    .join(" ");
  const costPath = filtered
    .map((s, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s.total_cost).toFixed(1)}`)
    .join(" ");

  // Area fill under value line
  const bottomY = PAD.top + CHART_H;
  const areaPath = `${valuePath} L${toX(filtered.length - 1).toFixed(1)},${bottomY} L${PAD.left},${bottomY} Z`;

  // Overall PnL determines gradient color
  const lastSnap = filtered[filtered.length - 1];
  const gradientColor = lastSnap.total_value >= lastSnap.total_cost ? "76, 175, 80" : "199, 85, 90";

  // Y-axis grid (5 lines)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const v = minY + (rangeY * (i + 0.5)) / 5;
    return { y: toY(v), label: fmtAxis(v) };
  });

  // X-axis labels (~5 evenly spaced)
  const xCount = Math.min(5, filtered.length);
  const xLabels = Array.from({ length: xCount }, (_, i) => {
    const idx = Math.round((i / (xCount - 1)) * (filtered.length - 1));
    const d = new Date(filtered[idx].snapshot_date);
    return {
      x: toX(idx),
      label: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    };
  });

  // Mouse tracking
  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;

    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < filtered.length; i++) {
      const dist = Math.abs(toX(i) - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setHoveredIdx(closest);
  }

  const hovered = hoveredIdx !== null ? filtered[hoveredIdx] : null;
  const hoveredPnl = hovered ? hovered.total_value - hovered.total_cost : 0;
  const hoveredRoi =
    hovered && hovered.total_cost > 0 ? (hoveredPnl / hovered.total_cost) * 100 : 0;

  // Tooltip position (percentage-based)
  const tooltipXPct = hoveredIdx !== null ? (toX(hoveredIdx) / W) * 100 : 0;
  const tooltipOnRight = tooltipXPct < 60;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Evolución del portfolio</span>
        <div className={styles.chartFilters}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`${styles.chartFilterBtn} ${range === r.key ? styles.chartFilterBtnActive : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartContainer}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.chartSvg}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={`rgb(${gradientColor})`} stopOpacity="0.15" />
              <stop offset="100%" stopColor={`rgb(${gradientColor})`} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={g.y}
                x2={W - PAD.right}
                y2={g.y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              <text
                x={PAD.left - 8}
                y={g.y + 3.5}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="var(--font-dm-mono), monospace"
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={H - 4}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="var(--font-dm-mono), monospace"
            >
              {l.label}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Cost line (dashed) */}
          <path
            d={costPath}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Value line */}
          <path
            d={valuePath}
            fill="none"
            stroke="var(--steel-blue)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover indicator */}
          {hoveredIdx !== null && (
            <>
              <line
                x1={toX(hoveredIdx)}
                y1={PAD.top}
                x2={toX(hoveredIdx)}
                y2={bottomY}
                stroke="var(--text-muted)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={toX(hoveredIdx)}
                cy={toY(filtered[hoveredIdx].total_value)}
                r="4"
                fill="var(--steel-blue)"
                stroke="var(--bg-dark)"
                strokeWidth="2"
              />
              <circle
                cx={toX(hoveredIdx)}
                cy={toY(filtered[hoveredIdx].total_cost)}
                r="3"
                fill="var(--text-muted)"
                stroke="var(--bg-dark)"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hovered && hoveredIdx !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltipOnRight ? `calc(${tooltipXPct}% + 14px)` : undefined,
              right: !tooltipOnRight
                ? `calc(${100 - tooltipXPct}% + 14px)`
                : undefined,
              top: "40%",
            }}
          >
            <div className={styles.tooltipDate}>
              {new Date(hovered.snapshot_date).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className={styles.tooltipRow}>
              <span>Valor</span>
              <span className={styles.tooltipValue}>{fmtEur(hovered.total_value)}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span>Coste</span>
              <span>{fmtEur(hovered.total_cost)}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span>PnL</span>
              <span style={{ color: hoveredPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                {hoveredPnl >= 0 ? "+" : ""}
                {fmtEur(hoveredPnl)} ({hoveredRoi >= 0 ? "+" : ""}
                {hoveredRoi.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: "var(--steel-blue)" }} />
          <span>Valor</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDash} />
          <span>Coste</span>
        </div>
      </div>
    </div>
  );
}
