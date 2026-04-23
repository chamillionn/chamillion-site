"use client";

import { useState, useMemo } from "react";
import styles from "./year-daily-chart.module.css";

interface Props {
  year: number;
  daily: number[]; // 30 values for April 1-30
  monthlyTotal: number; // Official KMA total
  maxDailyDate?: string;
  maxDailyValue?: number;
  note?: string;
}

export default function YearDailyChart({
  year,
  daily,
  monthlyTotal,
  maxDailyDate,
  maxDailyValue,
  note,
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    const daysWithRain = daily.filter((v) => v > 0.1).length;
    const era5Total = daily.reduce((a, b) => a + b, 0);
    const yMax = Math.max(...daily, 1) * 1.1;
    return { daysWithRain, era5Total, yMax };
  }, [daily]);

  const cumulative = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const v of daily) {
      acc += v;
      out.push(acc);
    }
    return out;
  }, [daily]);

  const hitFortyAt = cumulative.findIndex((v) => v >= 40);
  const crossedForty = hitFortyAt !== -1;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.titleGroup}>
          <h4 className={styles.yearLabel}>Abril {year}</h4>
          <span className={styles.crossed}>
            {crossedForty
              ? `Cruzó 40 mm el día ${hitFortyAt + 1}`
              : "Cerró bajo 40 mm"}
          </span>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total oficial</span>
            <span className={styles.statValue}>{monthlyTotal.toFixed(1)} mm</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Días con lluvia</span>
            <span className={styles.statValue}>{stats.daysWithRain} / 30</span>
          </div>
          {maxDailyValue != null && maxDailyDate && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Día más lluvioso</span>
              <span className={styles.statValue}>
                {maxDailyValue} mm <small>· {maxDailyDate.slice(5)}</small>
              </span>
            </div>
          )}
        </div>
      </header>

      <div
        className={styles.chartWrap}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          className={styles.chart}
          viewBox="0 0 310 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* 40mm threshold expressed as daily equivalent would be misleading;
              instead draw cumulative crossing marker */}
          {daily.map((v, i) => {
            const w = 9;
            const gap = 1;
            const x = i * (w + gap);
            const h = (v / stats.yMax) * 70;
            const y = 80 - h;
            const isHover = hoverIdx === i;
            const isCrossDay = crossedForty && i === hitFortyAt;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIdx(i)}
                style={{ cursor: v > 0 ? "pointer" : "default" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={Math.max(0.5, h)}
                  fill={
                    isCrossDay
                      ? "var(--steel-blue)"
                      : v > 10
                        ? "color-mix(in oklch, var(--steel-blue) 60%, transparent)"
                        : v > 0
                          ? "color-mix(in oklch, var(--steel-blue) 32%, transparent)"
                          : "color-mix(in oklch, var(--text-muted) 15%, transparent)"
                  }
                  opacity={hoverIdx === null || isHover ? 1 : 0.55}
                  rx="1.2"
                  style={{ transition: "opacity 160ms" }}
                />
                {isCrossDay && (
                  <circle
                    cx={x + w / 2}
                    cy={y - 4}
                    r="2"
                    fill="var(--steel-blue)"
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className={styles.dayLabels}>
          {[1, 10, 20, 30].map((d) => (
            <span key={d} className={styles.dayLabel} style={{ left: `${((d - 1) / 29) * 100}%` }}>
              {d}
            </span>
          ))}
        </div>

        {hoverIdx !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `calc(${(hoverIdx / 29) * 100}% - 52px)`,
            }}
          >
            <span className={styles.tooltipDay}>{year}-04-{String(hoverIdx + 1).padStart(2, "0")}</span>
            <span className={styles.tooltipValue}>
              {daily[hoverIdx] > 0 ? `${daily[hoverIdx].toFixed(1)} mm` : "sin lluvia"}
            </span>
            <span className={styles.tooltipCumulative}>
              acum. {cumulative[hoverIdx].toFixed(1)} mm
            </span>
          </div>
        )}
      </div>

      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}
