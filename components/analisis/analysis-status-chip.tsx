import type {
  Analysis,
  AnalysisPublic,
  AnalysisSnapshot,
} from "@/lib/supabase/types";
import styles from "./analysis-status-chip.module.css";

type AnalysisLike = Analysis | AnalysisPublic;

interface Props {
  analysis: AnalysisLike;
  latestSnapshot?: AnalysisSnapshot | null;
}

/**
 * Small status chip for analysis list cards. Shows:
 *   - Resolved: outcome + ROI (if any)
 *   - Unresolved + has_prediction: en-curso/holgado/apretando + gap to target
 *   - No prediction: nothing (return null)
 */
export default function AnalysisStatusChip({ analysis, latestSnapshot }: Props) {
  if (!analysis.has_prediction) return null;

  if (analysis.resolved_at && analysis.final_outcome) {
    const outcome = analysis.final_outcome;
    const roi = analysis.final_roi_pct;
    return (
      <span
        className={`${styles.chip} ${styles[`chip-${outcome}`]}`}
        title={`Resuelta · ${outcome}`}
      >
        <span className={styles.dot} />
        <span className={styles.label}>
          {outcome === "cumplida" ? "Cumplida" : outcome === "fallida" ? "Fallida" : "Resuelta"}
        </span>
        {roi != null && (
          <span className={styles.roi}>
            {roi >= 0 ? "+" : ""}
            {roi.toFixed(1)}%
          </span>
        )}
      </span>
    );
  }

  const current = latestSnapshot?.underlying?.value ?? null;
  const target = analysis.prediction_target_value;

  if (current == null || target == null) {
    return (
      <span className={`${styles.chip} ${styles["chip-en-curso"]}`}>
        <span className={styles.dot} />
        <span className={styles.label}>En curso</span>
      </span>
    );
  }

  const direction = analysis.prediction_direction;
  let variant: "holgado" | "en-curso" | "apretando" | "fallada" = "en-curso";
  let gapLabel = "";
  const unit = analysis.prediction_unit ?? "";

  if (direction === "bearish") {
    if (current >= target) {
      variant = "fallada";
    } else {
      const gap = target - current;
      const pct = target > 0 ? gap / target : 0;
      variant = pct > 0.25 ? "holgado" : pct < 0.08 ? "apretando" : "en-curso";
      gapLabel = `${gap.toFixed(1)}${unit ? ` ${unit}` : ""}`;
    }
  } else if (direction === "bullish") {
    if (current >= target) {
      variant = "holgado";
    } else {
      const gap = target - current;
      const pct = target > 0 ? gap / target : 0;
      variant = pct > 0.25 ? "en-curso" : pct < 0.08 ? "apretando" : "en-curso";
      gapLabel = `${gap.toFixed(1)}${unit ? ` ${unit}` : ""}`;
    }
  }

  const labels: Record<typeof variant, string> = {
    holgado: "Holgado",
    "en-curso": "En curso",
    apretando: "Apretando",
    fallada: "Fallada",
  };

  return (
    <span
      className={`${styles.chip} ${styles[`chip-${variant}`]}`}
      title={`${labels[variant]}${gapLabel ? ` · margen ${gapLabel}` : ""}`}
    >
      <span className={styles.dot} />
      <span className={styles.label}>{labels[variant]}</span>
      {gapLabel && <span className={styles.gap}>{gapLabel}</span>}
    </span>
  );
}
