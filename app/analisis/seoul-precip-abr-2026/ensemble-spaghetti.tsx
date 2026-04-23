"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./ensemble-spaghetti.module.css";

interface Props {
  /** Cumulative precipitation over the forecast window per ensemble member */
  members: number[][]; // [memberIndex][dayIndex] = cumulative mm
  /** Day labels (length = daysCount) */
  days: string[];
  /** Starting value (typically MTD) added to each member's first day */
  baseline?: number;
  /** Threshold line to highlight (final cumulative target) */
  threshold?: number;
  unit?: string;
  height?: number;
}

/**
 * Spaghetti plot of ensemble members with:
 * - per-member line (semi-transparent)
 * - ensemble mean (bold)
 * - 10th / 90th percentile band
 * - optional threshold horizontal line
 * - reveal animation on viewport entry
 */
export default function EnsembleSpaghetti({
  members,
  days,
  baseline = 0,
  threshold,
  unit = "mm",
  height = 260,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRevealed(true);
          ob.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  if (members.length === 0 || members[0].length === 0) {
    return null;
  }

  // Convert to cumulative totals (baseline + sum-so-far per day)
  const cumulative = members.map((member) =>
    member.reduce<number[]>((acc, v, i) => {
      const prev = i === 0 ? baseline : acc[i - 1];
      acc.push(prev + v);
      return acc;
    }, []),
  );

  const daysCount = cumulative[0].length;
  const yMax = Math.max(
    threshold ?? 0,
    ...cumulative.flat(),
  ) * 1.08;
  const yMin = Math.min(baseline, ...cumulative.flat()) * 0.98;

  const toX = (dayIdx: number) => (dayIdx / (daysCount - 1)) * 100;
  const toY = (val: number) => ((yMax - val) / (yMax - yMin)) * height;

  // Mean line
  const mean = Array.from({ length: daysCount }, (_, i) => {
    const sum = cumulative.reduce((acc, m) => acc + m[i], 0);
    return sum / cumulative.length;
  });

  // 10/90 percentiles
  const sortedByDay = Array.from({ length: daysCount }, (_, i) =>
    cumulative.map((m) => m[i]).sort((a, b) => a - b),
  );
  const p10 = sortedByDay.map((s) => s[Math.floor(s.length * 0.1)]);
  const p90 = sortedByDay.map((s) => s[Math.floor(s.length * 0.9)]);

  const polyPath = (points: number[]) =>
    points
      .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(v).toFixed(2)}`)
      .join(" ");

  const bandPath =
    `M${toX(0)},${toY(p90[0])} ` +
    p90.map((v, i) => `L${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ") +
    ` L${toX(daysCount - 1)},${toY(p10[daysCount - 1])} ` +
    p10
      .slice()
      .reverse()
      .map((v, i) => `L${toX(daysCount - 1 - i).toFixed(2)},${toY(v).toFixed(2)}`)
      .join(" ") +
    " Z";

  return (
    <div ref={ref} className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        {/* Baseline + threshold reference lines */}
        {threshold != null && (
          <g>
            <line
              x1="0"
              y1={toY(threshold)}
              x2="100"
              y2={toY(threshold)}
              stroke="rgba(var(--steel-blue-rgb), 0.55)"
              strokeWidth="0.6"
              strokeDasharray="1.2 1.2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

        {/* Percentile band */}
        <path
          d={bandPath}
          fill="rgba(var(--steel-blue-rgb), 0.12)"
          style={{
            opacity: revealed ? 1 : 0,
            transition: "opacity 600ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />

        {/* Per-member lines */}
        {cumulative.map((m, i) => {
          const final = m[m.length - 1];
          const crossesThreshold = threshold != null && final >= threshold;
          return (
            <path
              key={i}
              d={polyPath(m)}
              fill="none"
              stroke={
                crossesThreshold
                  ? "rgba(199, 85, 90, 0.45)"
                  : "rgba(var(--steel-blue-rgb), 0.4)"
              }
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
              style={{
                strokeDasharray: revealed ? "none" : "200 200",
                strokeDashoffset: revealed ? 0 : 200,
                opacity: revealed ? 1 : 0,
                transition: `opacity 480ms ease ${i * 12}ms, stroke-dashoffset 700ms ease ${i * 12}ms`,
              }}
            />
          );
        })}

        {/* Mean line */}
        <path
          d={polyPath(mean)}
          fill="none"
          stroke="var(--steel-blue)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          style={{
            opacity: revealed ? 1 : 0,
            transition: "opacity 600ms cubic-bezier(0.16,1,0.3,1) 400ms",
          }}
        />

        {/* Hover column */}
        {hoverDay !== null && (
          <line
            x1={toX(hoverDay)}
            y1="0"
            x2={toX(hoverDay)}
            y2={height}
            stroke="rgba(var(--steel-blue-rgb), 0.25)"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Invisible hover rectangles */}
        {days.map((_, i) => (
          <rect
            key={i}
            x={toX(i) - (100 / daysCount) / 2}
            y="0"
            width={100 / daysCount}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverDay(i)}
            onMouseLeave={() => setHoverDay(null)}
          />
        ))}
      </svg>

      {/* Labels */}
      <div className={styles.daysAxis}>
        {days.map((d, i) => (
          <span
            key={i}
            className={`${styles.dayLabel} ${hoverDay === i ? styles.dayLabelActive : ""}`}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Threshold caption */}
      {threshold != null && (
        <div
          className={styles.thresholdCap}
          style={{ top: `${toY(threshold) - 10}px` }}
        >
          umbral {threshold} {unit}
        </div>
      )}

      {/* Hover info */}
      {hoverDay !== null && (
        <div className={styles.hoverInfo}>
          <span className={styles.hoverDay}>{days[hoverDay]}</span>
          <span className={styles.hoverStat}>
            media <strong>{mean[hoverDay].toFixed(1)} {unit}</strong>
          </span>
          <span className={styles.hoverStat}>
            rango{" "}
            <strong>
              {p10[hoverDay].toFixed(1)}–{p90[hoverDay].toFixed(1)}
            </strong>
          </span>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchMember}`} /> miembros ({members.length})
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchAbove}`} /> supera umbral
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchMean}`} /> media
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchBand}`} /> p10–p90
        </span>
      </div>
    </div>
  );
}
