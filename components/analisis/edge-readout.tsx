import type { TrackerEdge } from "@/lib/supabase/types";
import styles from "./edge-readout.module.css";

interface Props {
  edge: TrackerEdge | null;
  /** Override to render a custom body (e.g. per-analysis text) */
  children?: React.ReactNode;
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${Math.abs(n * 100).toFixed(1)}%`;
}

function formatUsd(n: number) {
  const sign = n < 0 ? "−" : n > 0 ? "+" : "";
  return `${sign}$${Math.abs(n).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
}

export default function EdgeReadout({ edge, children }: Props) {
  if (children) {
    return <div className={styles.wrap}>{children}</div>;
  }

  if (!edge) {
    return (
      <div className={styles.empty}>
        Edge pendiente de primer tick del tracker.
      </div>
    );
  }

  const breakEven = edge.mktProb;
  const myProb = edge.myProb;
  const evPositive = edge.evAbs >= 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.primary}>
        <div className={styles.evBlock}>
          <span className={styles.evLabel}>EV</span>
          <span
            className={`${styles.evValue} ${evPositive ? styles.pos : styles.neg}`}
          >
            {formatUsd(edge.evAbs)}
          </span>
          <span className={styles.evPct}>
            {formatPct(edge.evPct / 100)}
          </span>
        </div>

        <div className={styles.probRow}>
          <div className={styles.probBlock}>
            <span className={styles.probLabel}>Mi probabilidad</span>
            <span className={styles.probValue}>{(myProb * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.probBlock}>
            <span className={styles.probLabel}>Break-even</span>
            <span className={styles.probValue}>{(breakEven * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {edge.note && <p className={styles.note}>{edge.note}</p>}

      <div className={styles.meta}>
        <span>fuente · {edge.source}</span>
      </div>
    </div>
  );
}
