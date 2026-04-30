"use client";

import { useState, useMemo } from "react";
import {
  HISTORICAL_APRIL,
  HISTORICAL_STATS,
  APRIL_DAILY_HISTORY,
  CURRENT_APRIL_DAILY,
} from "../data";
import styles from "./historical-card.module.css";

interface Props {
  currentMtdMm: number;
  threshold: number;
}

type YearEntry = { year: number; totalMm: number; isCurrent?: boolean };

export default function HistoricalCard({ currentMtdMm, threshold }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const entries: YearEntry[] = useMemo(() => [
    ...HISTORICAL_APRIL.map((r) => ({ year: r.year, totalMm: r.totalMm })),
    { year: 2026, totalMm: currentMtdMm, isCurrent: true },
  ], [currentMtdMm]);

  const maxMm = Math.max(...entries.map((e) => e.totalMm), threshold + 10);

  // chart height in px (inner bar area, minus year label space)
  const chartPx = 132;
  const thresholdPct = (threshold / maxMm) * 100;
  const thresholdBottom = `${thresholdPct}%`;
  const yTicks = [20, 60].filter((t) => t < maxMm);

  function barColor(e: YearEntry) {
    if (e.isCurrent) return styles.bar2026;
    return e.totalMm > threshold ? styles.barAbove : styles.barBelow;
  }

  const countAbove = HISTORICAL_APRIL.filter((r) => r.totalMm > threshold).length;
  const countBelow = HISTORICAL_APRIL.length - countAbove;

  const dailyData: number[] | null = useMemo(() => {
    if (selectedYear === null) return null;
    if (selectedYear === 2026) return CURRENT_APRIL_DAILY;
    return APRIL_DAILY_HISTORY[selectedYear] ?? null;
  }, [selectedYear]);

  const selectedEntry = selectedYear !== null
    ? entries.find((e) => e.year === selectedYear)
    : null;

  const dailyMax = dailyData ? Math.max(...dailyData, 1) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Historial · Abril · Seúl</span>
        <span className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotBelow}`} />
            ≤{threshold}mm
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotAbove}`} />
            &gt;{threshold}mm
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDot2026}`} />
            2026 MTD
          </span>
        </span>
      </div>

      <div className={styles.chartWrap}>
        <div className={styles.chart} style={{ height: `${chartPx + 28}px` }}>
          {/* y-axis reference ticks */}
          {yTicks.map((t) => (
            <div
              key={t}
              className={styles.yTick}
              style={{ bottom: `calc(${(t / maxMm) * 100}% + 38px)` }}
              aria-hidden="true"
            >
              <span className={styles.yTickLabel}>{t}</span>
            </div>
          ))}

          {/* threshold line */}
          <div
            className={styles.thresholdLine}
            style={{ bottom: `calc(${thresholdBottom} + 38px)` }}
          >
            <span className={styles.thresholdLabel}>{threshold}mm</span>
          </div>

          {entries.map((entry) => {
            const heightPct = (entry.totalMm / maxMm) * chartPx;
            const isSelected = selectedYear === entry.year;

            return (
              <div
                key={entry.year}
                role="button"
                tabIndex={0}
                className={`${styles.col} ${entry.isCurrent ? styles.col2026 : ""}`}
                onClick={() =>
                  setSelectedYear(isSelected ? null : entry.year)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedYear(isSelected ? null : entry.year);
                  }
                }}
                aria-label={`${entry.year}: ${entry.totalMm.toFixed(1)}mm`}
                aria-expanded={isSelected}
                style={{ height: "100%" }}
              >
                {/* floating value — always visible for 2026, hover for others */}
                <span
                  className={`${styles.valueLabel} ${entry.isCurrent ? styles.valueLabelOwn : ""}`}
                  aria-hidden="true"
                >
                  {entry.totalMm.toFixed(entry.isCurrent ? 1 : 0)}
                  {entry.isCurrent ? "*" : ""}
                </span>

                <div
                  className={`${styles.bar} ${barColor(entry)}`}
                  style={{ height: `${heightPct}px` }}
                />

                <span
                  className={`${styles.yearLabel} ${isSelected ? styles.yearLabelActive : ""}`}
                  aria-hidden="true"
                >
                  {entry.isCurrent ? "2026*" : String(entry.year)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statKey}>Media 10a</span>
          <span className={styles.statVal}>{HISTORICAL_STATS.mean}mm</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Mediana</span>
          <span className={styles.statVal}>{HISTORICAL_STATS.median}mm</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Normal 91-20</span>
          <span className={styles.statVal}>{HISTORICAL_STATS.climatologicalNormal1991_2020}mm</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Bajo umbral</span>
          <span className={styles.statVal}>{countBelow}/{HISTORICAL_APRIL.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Sobre umbral</span>
          <span className={`${styles.statVal} ${styles.statValMuted}`}>{countAbove}/{HISTORICAL_APRIL.length}</span>
        </div>
      </div>

      {selectedYear !== null && selectedEntry && dailyData && (
        <div className={styles.detail}>
          <div className={styles.detailHead}>
            <span className={styles.detailTitle}>
              {selectedYear} · día a día
              {selectedEntry.isCurrent ? " (datos hasta el 23 abr)" : ""}
              {" · "}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {selectedEntry.totalMm.toFixed(1)}mm total
              </span>
            </span>
            <button className={styles.closeBtn} onClick={() => setSelectedYear(null)}>
              ✕ cerrar
            </button>
          </div>
          <div className={styles.dailyGrid}>
            {Array.from({ length: 30 }, (_, i) => {
              const mm = i < dailyData.length ? dailyData[i] : 0;
              const isFuture = selectedEntry.isCurrent && i >= dailyData.length;
              const isPeak = !isFuture && mm === Math.max(...dailyData);
              const barH = isFuture ? 2 : Math.max(2, (mm / dailyMax) * 48);

              return (
                <div key={i} className={styles.day}>
                  <span className={styles.dayNum}>{i + 1}</span>
                  <div
                    className={`${styles.dayBar} ${
                      isFuture
                        ? ""
                        : isPeak && mm > 0
                        ? styles.dayBarPeak
                        : selectedEntry.isCurrent
                        ? styles.dayBarOwn
                        : ""
                    }`}
                    style={{ height: `${barH}px`, opacity: isFuture ? 0.15 : 1 }}
                  />
                  <span className={`${styles.dayVal} ${mm === 0 ? styles.dayValZero : ""}`}>
                    {isFuture ? "–" : mm > 0 ? mm.toFixed(1) : "0"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
