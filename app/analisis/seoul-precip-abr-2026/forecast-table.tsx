"use client";

import { useState } from "react";
import styles from "./forecast-table.module.css";

export interface ForecastRow {
  model: string;
  modelTerm?: React.ReactNode;
  daily: number[];
  total: number;
  note?: string;
}

interface Props {
  rows: ForecastRow[];
  days: string[];
  threshold?: { value: number; label?: string };
  unit?: string;
}

/**
 * Heatmap-style model comparison. Rows = models, columns = days.
 * Cell intensity = precipitation amount; 0 days stay muted.
 * Hover any cell to see a floating summary. Total column on the right.
 */
export default function ForecastTable({ rows, days, threshold, unit = "mm" }: Props) {
  const [hover, setHover] = useState<{ row: number; day: number } | null>(null);
  const allMax = Math.max(
    threshold?.value ?? 0,
    ...rows.flatMap((r) => r.daily),
  );
  const maxTotal = Math.max(...rows.map((r) => r.total), threshold?.value ?? 0);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.row} ${styles.rowHead}`}>
        <div className={styles.modelCol}>Modelo</div>
        <div className={styles.daysCol}>
          {days.map((d, i) => (
            <span key={i} className={styles.dayHead}>
              {d}
            </span>
          ))}
        </div>
        <div className={styles.totalColHead}>Total 7d</div>
      </div>

      {rows.map((row, rIdx) => (
        <div
          key={rIdx}
          className={`${styles.row} ${hover?.row === rIdx ? styles.rowActive : ""}`}
        >
          <div className={styles.modelCol}>
            <span className={styles.modelName}>{row.modelTerm ?? row.model}</span>
            {row.note && <span className={styles.modelNote}>{row.note}</span>}
          </div>
          <div className={styles.daysCol}>
            {row.daily.map((v, cIdx) => {
              const intensity = allMax > 0 ? Math.min(1, v / allMax) : 0;
              const active = hover?.row === rIdx && hover?.day === cIdx;
              const bg =
                v === 0
                  ? "color-mix(in oklch, var(--border) 25%, transparent)"
                  : `color-mix(in oklch, var(--steel-blue) ${Math.round(intensity * 72 + 10)}%, transparent)`;
              return (
                <button
                  key={cIdx}
                  type="button"
                  className={`${styles.cell} ${active ? styles.cellActive : ""}`}
                  style={{ background: bg }}
                  onMouseEnter={() => setHover({ row: rIdx, day: cIdx })}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`${row.model} ${days[cIdx]} ${v.toFixed(1)} ${unit}`}
                >
                  {v >= 1 && (
                    <span className={styles.cellValue}>{v.toFixed(1)}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className={styles.totalCol}>
            <span className={styles.totalValue}>
              {row.total.toFixed(1)}
              <small className={styles.totalUnit}>{unit}</small>
            </span>
            <div className={styles.totalBar}>
              <div
                className={styles.totalBarFill}
                style={{
                  width: `${Math.min(100, (row.total / Math.max(1, maxTotal)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {threshold && (
        <div className={styles.footer}>
          <span className={styles.footerLabel}>
            {threshold.label ?? "umbral"}
          </span>
          <span className={styles.footerValue}>
            +{threshold.value} {unit}
          </span>
          <span className={styles.footerNote}>
            nadie lo cruza · la tesis aguanta
          </span>
        </div>
      )}

      {hover !== null && (
        <div className={styles.hoverCard}>
          <span className={styles.hoverModel}>{rows[hover.row].model}</span>
          <span className={styles.hoverDay}>{days[hover.day]}</span>
          <span className={styles.hoverValue}>
            {rows[hover.row].daily[hover.day].toFixed(1)} {unit}
          </span>
        </div>
      )}
    </div>
  );
}
