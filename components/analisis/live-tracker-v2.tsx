"use client";

import type {
  Analysis,
  AnalysisPublic,
  AnalysisSnapshot,
  AnalysisEvent,
  AnalysisOutcome,
} from "@/lib/supabase/types";

type AnalysisLike = Analysis | AnalysisPublic;
import UnderlyingStrip, { type UnderlyingBucket } from "./underlying-strip";
import PositionSummary from "./position-summary";
import EdgeReadout from "./edge-readout";
import EventTimeline from "./event-timeline";
import styles from "./live-tracker-v2.module.css";

interface Props {
  analysis: AnalysisLike;
  latest: AnalysisSnapshot | null;
  events: AnalysisEvent[];
  /** Bucket definition for the underlying strip (optional; falls back to continuous axis) */
  buckets?: UnderlyingBucket[];
  /** Reference line on the underlying strip (usually the threshold) */
  reference?: { value: number; label?: string };
  /** Source link for the underlying value */
  underlyingSourceUrl?: string;
  underlyingSourceLabel?: string;
  /** Override the edge body (e.g. bespoke Seoul explanation) */
  edgeOverride?: React.ReactNode;
}

type Status = "en-curso" | "holgado" | "fallada" | "cumplida";

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function formatCountdown(days: number) {
  if (days <= 0) return "hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

function deriveStatus(
  current: number | null,
  analysis: AnalysisLike,
): { status: Status; label: string } {
  // If already resolved, reflect that
  if (analysis.resolved_at && analysis.final_outcome) {
    const out = analysis.final_outcome as AnalysisOutcome;
    if (out === "cumplida") return { status: "cumplida", label: "Cumplida" };
    if (out === "fallida") return { status: "fallada", label: "Fallada" };
    return { status: "en-curso", label: "Resuelta" };
  }
  if (current == null || analysis.prediction_target_value == null) {
    return { status: "en-curso", label: "En curso" };
  }
  const target = analysis.prediction_target_value;
  const direction = analysis.prediction_direction;
  // For bearish (Seoul): crossed = current >= target (threshold) → fallada
  if (direction === "bearish") {
    if (current >= target) return { status: "fallada", label: "Fallada" };
    const gap = target - current;
    const pct = target > 0 ? gap / target : 0;
    return pct > 0.25
      ? { status: "holgado", label: "Holgado" }
      : { status: "en-curso", label: "En curso" };
  }
  if (direction === "bullish") {
    if (current >= target) return { status: "cumplida", label: "Cumplida" };
    const gap = target - current;
    const pct = target > 0 ? gap / target : 0;
    return pct > 0.25
      ? { status: "en-curso", label: "En curso" }
      : { status: "holgado", label: "Holgado" };
  }
  return { status: "en-curso", label: "En curso" };
}

export default function LiveTrackerV2({
  analysis,
  latest,
  events,
  buckets,
  reference,
  underlyingSourceUrl,
  underlyingSourceLabel,
  edgeOverride,
}: Props) {
  const currentValue = latest?.underlying?.value ?? null;
  const underlyingSource = latest?.underlying?.source ?? null;
  const underlyingAsOf = latest?.underlying?.asOf ?? null;

  const { status, label } = deriveStatus(currentValue, analysis);

  // Countdowns
  const now = new Date();
  const endDate = analysis.prediction_end_date
    ? new Date(analysis.prediction_end_date + "T23:59:59Z")
    : null;
  const daysToEnd = endDate ? Math.max(0, daysBetween(now, endDate)) : null;

  const captionParts: string[] = [];
  if (underlyingSource) captionParts.push(`Fuente · ${underlyingSource}`);
  if (underlyingAsOf) {
    const d = new Date(underlyingAsOf);
    captionParts.push(
      d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    );
  }

  return (
    <section className={styles.wrap} aria-label="Seguimiento en vivo">
      {/* Header row: status + countdown + resolved badge */}
      <header className={styles.header}>
        <div className={styles.statusGroup}>
          <span
            className={`${styles.dot} ${styles[`dot-${status}`]}`}
            aria-hidden="true"
          />
          <span className={styles.statusLabel}>{label}</span>
          {analysis.final_roi_pct != null && (
            <span
              className={`${styles.roi} ${analysis.final_roi_pct >= 0 ? styles.roiPos : styles.roiNeg}`}
            >
              {analysis.final_roi_pct >= 0 ? "+" : ""}
              {analysis.final_roi_pct.toFixed(1)}% ROI
            </span>
          )}
        </div>
        {daysToEnd != null && !analysis.resolved_at && (
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Cierra datos en</span>
            <span className={styles.countdownValue}>
              {formatCountdown(daysToEnd)}
            </span>
          </div>
        )}
      </header>

      {/* Underlying strip */}
      {currentValue != null && (
        <div className={styles.underlying}>
          <UnderlyingStrip
            current={currentValue}
            unit={analysis.prediction_unit ?? ""}
            buckets={buckets}
            reference={reference}
            caption={captionParts.join(" · ") || undefined}
          />
          {underlyingSourceUrl && (
            <a
              className={styles.sourceLink}
              href={underlyingSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {underlyingSourceLabel ?? "Ver fuente"} ↗
            </a>
          )}
        </div>
      )}

      {currentValue == null && (
        <div className={styles.pendingUnderlying}>
          Sin datos del subyacente todavía. Esperando al primer tick del tracker.
        </div>
      )}

      {/* Position */}
      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Posición</h3>
        <PositionSummary position={latest?.position ?? null} />
      </div>

      {/* Edge */}
      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Edge</h3>
        {edgeOverride ? (
          <EdgeReadout edge={null}>{edgeOverride}</EdgeReadout>
        ) : (
          <EdgeReadout edge={latest?.edge ?? null} />
        )}
      </div>

      {/* Event timeline */}
      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Cronología</h3>
        <EventTimeline events={events} />
      </div>
    </section>
  );
}
