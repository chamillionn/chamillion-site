"use client";

import { useEffect, useState } from "react";
import styles from "./status-vitals.module.css";

interface Props {
  mtdMm: number;
  threshold: number;
  /** ISO date — e.g. "2026-04-30T23:59:00Z" */
  resolutionDate: string;
  isResolved: boolean;
  /** "30 abr" / "30 abr 2026" — pretty short label for resolution date. */
  resolutionLabel: string;
}

function formatRemaining(deadlineMs: number, nowMs: number): string {
  const diff = deadlineMs - nowMs;
  if (!Number.isFinite(diff) || diff <= 0) return "0";
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days >= 1) return `${days}d ${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m`;
  return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
}

export default function StatusVitals({
  mtdMm,
  threshold,
  resolutionDate,
  isResolved,
  resolutionLabel,
}: Props) {
  const deadlineMs = Date.parse(resolutionDate);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (isResolved || !Number.isFinite(deadlineMs)) return;
    // Tick once a second. Pause when tab hidden to spare battery.
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id != null) return;
      id = setInterval(() => setNow(Date.now()), 1000);
    };
    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isResolved, deadlineMs]);

  const ratio =
    Number.isFinite(mtdMm) && threshold > 0
      ? Math.max(0, Math.min(1, mtdMm / threshold))
      : 0;
  const overflow = Number.isFinite(mtdMm) && mtdMm > threshold;
  const mtdSafe = Number.isFinite(mtdMm) ? mtdMm.toFixed(1) : "—";

  const countdownText = isResolved
    ? "Resuelto"
    : Number.isFinite(deadlineMs)
      ? formatRemaining(deadlineMs, now)
      : "—";

  return (
    <div className={styles.vitals}>
      <div className={styles.vital}>
        <span className={styles.label}>
          MTD <span className={styles.labelSep}>·</span>{" "}
          <span className={`${styles.value} ${overflow ? styles.valueOver : ""}`}>
            {mtdSafe}
          </span>
          <span className={styles.unit}>/{threshold} mm</span>
        </span>
        <span className={styles.bar} aria-hidden="true">
          <span
            className={`${styles.barFill} ${overflow ? styles.barFillOver : ""}`}
            style={{ transform: `scaleX(${ratio})` }}
          />
          {overflow && <span className={styles.barOverflowMark} />}
        </span>
      </div>

      <div className={styles.vital}>
        <span className={styles.label}>
          Resolución <span className={styles.labelSep}>·</span>{" "}
          <span className={styles.unit}>{resolutionLabel}</span>
        </span>
        <span
          className={`${styles.countdown} ${isResolved ? styles.countdownResolved : ""}`}
        >
          {countdownText}
        </span>
      </div>
    </div>
  );
}
