import type { TrackerPosition } from "@/lib/supabase/types";
import styles from "./position-summary.module.css";

interface Props {
  position: TrackerPosition | null;
  /** Optional placeholder when we don't have a snapshot yet */
  placeholder?: React.ReactNode;
}

function formatUsd(n: number) {
  const sign = n < 0 ? "−" : n > 0 ? "+" : "";
  return `${sign}$${Math.abs(n).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
}

function formatCents(p: number) {
  return `${(p * 100).toFixed(0)}¢`;
}

export default function PositionSummary({ position, placeholder }: Props) {
  if (!position || position.legs.length === 0) {
    return (
      <div className={styles.empty}>
        {placeholder ?? "Sin posiciones abiertas todavía."}
      </div>
    );
  }

  const totalPnlPositive = position.totalCashPnl >= 0;

  return (
    <div className={styles.wrap}>
      <ul className={styles.legs}>
        {position.legs.map((leg, i) => {
          const pnlPositive = leg.cashPnl >= 0;
          return (
            <li key={i} className={styles.leg}>
              <div className={styles.legName}>
                <span className={styles.legTitle}>{leg.name}</span>
                <span className={styles.legMeta}>
                  <span className={`${styles.side} ${styles[`side-${leg.side.toLowerCase()}`]}`}>
                    {leg.side}
                  </span>
                  <span>{leg.size.toLocaleString("es-ES")} ct</span>
                  <span>@ {formatCents(leg.avgPrice)}</span>
                </span>
              </div>
              <div className={styles.legRight}>
                <span className={styles.legCurrent}>
                  {formatCents(leg.curPrice)}
                  <small className={styles.legCurrentHint}>actual</small>
                </span>
                <span
                  className={`${styles.legPnl} ${pnlPositive ? styles.pnlPos : styles.pnlNeg}`}
                >
                  {formatUsd(leg.cashPnl)}
                  <small className={styles.legPnlPct}>
                    {pnlPositive ? "+" : ""}
                    {leg.pnlPct.toFixed(1)}%
                  </small>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className={styles.totals}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>PnL total</span>
          <span
            className={`${styles.totalValue} ${totalPnlPositive ? styles.pnlPos : styles.pnlNeg}`}
          >
            {formatUsd(position.totalCashPnl)}
          </span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Notional</span>
          <span className={styles.totalValue}>
            ${position.totalNotional.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}
