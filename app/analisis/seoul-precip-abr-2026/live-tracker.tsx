"use client";

import Term from "@/components/analisis/term";
import BucketStrip, { type StripBucket } from "./bucket-strip";
import styles from "./live-tracker.module.css";

interface Props {
  current: number;
  target: number;
  unit: string;
  endDate: string; // Apr 30
  publicationDate: string; // ~May 7
  direction: "below" | "above";
  sourceUrl: string;
  sourceLabel: string;
  /** Label for the live-data source (e.g. "Open-Meteo estimate · hoy") */
  liveSourceLabel?: string;
  /** Polymarket buckets for the strike-rate strip */
  buckets: StripBucket[];
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

export default function LiveTracker({
  current,
  target,
  unit,
  endDate,
  publicationDate,
  direction,
  sourceUrl,
  sourceLabel,
  liveSourceLabel,
  buckets,
}: Props) {
  const end = new Date(endDate + "T23:59:59Z");
  const pub = new Date(publicationDate + "T23:59:59Z");
  const now = new Date();
  const daysToEnd = Math.max(0, daysBetween(now, end));
  const daysToPub = Math.max(0, daysBetween(now, pub));
  const status = getStatus({ current, target, direction, daysRemaining: daysToEnd });

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

      {/* Strike-rate strip with current marker */}
      <BucketStrip current={current} buckets={buckets} unit={unit} />

      {/* Meta / source */}
      <div className={styles.meta}>
        {liveSourceLabel && (
          <>
            <span className={styles.metaItem}>{liveSourceLabel}</span>
            <span className={styles.metaDot}>·</span>
          </>
        )}
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
