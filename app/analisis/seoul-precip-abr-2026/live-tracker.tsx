"use client";

import { useEffect, useState } from "react";
import type { AnalysisObservation } from "@/lib/supabase/types";
import Term from "@/components/analisis/term";
import styles from "./live-tracker.module.css";

interface Props {
  baseline: number;
  target: number;
  current: number;
  unit: string;
  endDate: string;          // resolution (last day of data, Apr 30)
  publicationDate: string;  // KMA publishes official total (~May 7)
  direction: "below" | "above";
  observations: AnalysisObservation[];
  sourceUrl: string;
  sourceLabel: string;
}

type Status = "en-curso" | "holgado" | "fallada" | "cumplida";

function getStatus({
  current,
  target,
  direction,
  daysRemaining,
}: {
  current: number;
  target: number;
  direction: "below" | "above";
  daysRemaining: number;
}): Status {
  const crossed =
    direction === "below" ? current >= target : current <= target;
  if (crossed) return "fallada";
  if (daysRemaining <= 0) return "cumplida";
  const gap = direction === "below" ? target - current : current - target;
  const pctGap = gap / target;
  // If the remaining gap is more than 25 % of the target, call it holgado
  return pctGap > 0.25 ? "holgado" : "en-curso";
}

const STATUS_LABEL: Record<Status, string> = {
  "en-curso": "En curso",
  holgado: "Holgado",
  cumplida: "Cumplida",
  fallada: "Fallada",
};

function daysBetween(a: Date, b: Date) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS);
}

function formatCountdown(days: number) {
  if (days <= 0) return "hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

// Tiny utility: animate a number from 0 to `to`
function useCountUp(to: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 5);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);
  return value;
}

export default function LiveTracker({
  baseline,
  target,
  current,
  unit,
  endDate,
  publicationDate,
  direction,
  observations,
  sourceUrl,
  sourceLabel,
}: Props) {
  const end = new Date(endDate + "T23:59:59Z");
  const pub = new Date(publicationDate + "T23:59:59Z");
  const now = new Date();
  const daysToEnd = Math.max(0, daysBetween(now, end));
  const daysToPub = Math.max(0, daysBetween(now, pub));
  const status = getStatus({ current, target, direction, daysRemaining: daysToEnd });

  const gap = direction === "below" ? target - current : current - target;
  const progress = Math.min(
    1,
    Math.max(0, direction === "below" ? current / target : target / Math.max(current, 1)),
  );

  const animatedCurrent = useCountUp(current);
  const animatedGap = useCountUp(Math.abs(gap));

  // Build line data from observations, or from baseline+current if none
  const linePoints: { x: number; y: number }[] = [];
  const startDate =
    observations.length > 0 ? new Date(observations[0].observed_at) : now;
  const totalRange = Math.max(1, daysBetween(startDate, end));
  if (observations.length > 0) {
    observations
      .slice()
      .sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime())
      .forEach((o) => {
        const d = daysBetween(startDate, new Date(o.observed_at));
        linePoints.push({ x: d / totalRange, y: Number(o.value) });
      });
  } else {
    linePoints.push({ x: 0, y: baseline });
    linePoints.push({ x: daysBetween(startDate, now) / totalRange, y: current });
  }

  const chartMaxY = Math.max(target * 1.1, current * 1.2, baseline * 1.3);
  const pxFor = (x: number) => x * 100;
  const pyFor = (y: number) => 100 - (y / chartMaxY) * 100;

  const path = linePoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${pxFor(p.x).toFixed(2)},${pyFor(p.y).toFixed(2)}`)
    .join(" ");

  return (
    <section className={styles.tracker} aria-label="Seguimiento en vivo">
      {/* Top row: status + dual countdown */}
      <div className={styles.topRow}>
        <div className={styles.statusGroup}>
          <span className={`${styles.dot} ${styles[`dot-${status}`]}`} aria-hidden="true" />
          <span className={styles.statusLabel}>{STATUS_LABEL[status]}</span>
        </div>

        <div className={styles.countdowns}>
          <div className={styles.countdown}>
            <Term slug="mtd">
              <span className={styles.countdownLabel}>Datos hasta 30-abr</span>
            </Term>
            <span className={styles.countdownValue}>{formatCountdown(daysToEnd)}</span>
          </div>
          <span className={styles.countdownSep}>·</span>
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Publicación oficial</span>
            <span className={styles.countdownValue}>{formatCountdown(daysToPub)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartWrap}>
        <svg
          className={styles.chart}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1={pyFor(target)}
            x2="100"
            y2={pyFor(target)}
            stroke="var(--steel-blue)"
            strokeWidth="0.35"
            strokeDasharray="1 1.5"
            opacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`${path} L${pxFor(linePoints[linePoints.length - 1].x).toFixed(2)},100 L${pxFor(linePoints[0].x).toFixed(2)},100 Z`}
            fill="url(#tracker-area)"
            opacity="0.7"
          />
          <path
            d={path}
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={styles.realityPath}
          />
          {linePoints.length > 0 && (
            <g>
              <circle
                cx={pxFor(linePoints[linePoints.length - 1].x)}
                cy={pyFor(linePoints[linePoints.length - 1].y)}
                r="1.5"
                fill="var(--text-primary)"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={pxFor(linePoints[linePoints.length - 1].x)}
                cy={pyFor(linePoints[linePoints.length - 1].y)}
                r="3"
                fill="var(--text-primary)"
                opacity="0.35"
                className={styles.pulse}
              />
            </g>
          )}
          <defs>
            <linearGradient id="tracker-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--steel-blue-rgb), 0.14)" />
              <stop offset="100%" stopColor="rgba(var(--steel-blue-rgb), 0)" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className={styles.targetTag}
          style={{ top: `${pyFor(target)}%` }}
        >
          <Term slug="umbral">umbral</Term> · {target} {unit}
        </span>
      </div>

      {/* Readout */}
      <div className={styles.readout}>
        <div className={styles.readoutMain}>
          <span className={styles.bigNumber}>{animatedCurrent.toFixed(1)}</span>
          <span className={styles.bigUnit}>{unit}</span>
          <span className={styles.bigHint}>ahora mismo</span>
        </div>
        <div className={styles.readoutGap}>
          <span className={styles.gapValue}>{animatedGap.toFixed(1)}</span>
          <span className={styles.gapLabel}>
            {unit} de {direction === "below" ? "margen" : "distancia"}
          </span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className={`${styles.progressFill} ${styles[`fill-${status}`]}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Source link */}
      <div className={styles.meta}>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
        >
          {sourceLabel} ↗
        </a>
      </div>
    </section>
  );
}
