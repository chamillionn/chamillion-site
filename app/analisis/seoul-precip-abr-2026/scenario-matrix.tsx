import styles from "./scenario-matrix.module.css";

export interface Scenario {
  label: string;
  probability: number; // 0-1
  /** PnL per leg, signed (+ win, − loss) */
  legPnl: number[];
}

export interface Leg {
  name: string;
  subtitle?: string;
}

interface Props {
  scenarios: Scenario[];
  legs: Leg[];
  currency?: string;
  /** Notional column on the left (optional) */
  notional?: number[];
}

function formatPnl(v: number, currency = "$") {
  const sign = v >= 0 ? "+" : "−";
  const abs = Math.abs(v).toLocaleString("es-ES", { maximumFractionDigits: 0 });
  return `${sign}${currency}${abs}`;
}

function cellTone(pnl: number): "win" | "loss" | "flat" {
  if (pnl > 5) return "win";
  if (pnl < -5) return "loss";
  return "flat";
}

export default function ScenarioMatrix({ scenarios, legs, currency = "$", notional }: Props) {
  const totals = scenarios.map((s) => s.legPnl.reduce((a, b) => a + b, 0));
  const ev = totals.reduce((acc, total, i) => acc + scenarios[i].probability * total, 0);
  const capitalDeployed = notional?.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `220px repeat(${legs.length}, 1fr) 1fr`,
        }}
      >
        {/* Header */}
        <div className={`${styles.cellHead} ${styles.cellScenario}`}>Escenario</div>
        {legs.map((l, i) => (
          <div key={i} className={styles.cellHead}>
            <div className={styles.legName}>{l.name}</div>
            {l.subtitle && <div className={styles.legSub}>{l.subtitle}</div>}
          </div>
        ))}
        <div className={`${styles.cellHead} ${styles.cellTotal}`}>Total</div>

        {/* Body rows */}
        {scenarios.map((s, rIdx) => (
          <div key={rIdx} className={styles.rowGroup}>
            <div className={`${styles.cellBody} ${styles.cellScenario}`}>
              <div className={styles.scenarioLabel}>{s.label}</div>
              <div className={styles.scenarioProb}>
                {(s.probability * 100).toFixed(1)}% prob.
              </div>
            </div>
            {s.legPnl.map((p, cIdx) => (
              <div
                key={cIdx}
                className={`${styles.cellBody} ${styles.cellMoney} ${styles[`tone-${cellTone(p)}`]}`}
              >
                {formatPnl(p, currency)}
              </div>
            ))}
            <div
              className={`${styles.cellBody} ${styles.cellTotal} ${styles[`tone-${cellTone(totals[rIdx])}`]}`}
            >
              <strong>{formatPnl(totals[rIdx], currency)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>EV esperado</span>
          <span
            className={`${styles.summaryValue} ${styles[`tone-${cellTone(ev)}`]}`}
          >
            {formatPnl(ev, currency)}
          </span>
        </div>
        {capitalDeployed > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Capital desplegado</span>
            <span className={styles.summaryValue}>
              {currency}
              {capitalDeployed.toLocaleString("es-ES")}
            </span>
          </div>
        )}
        {capitalDeployed > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>ROI esperado</span>
            <span className={`${styles.summaryValue} ${styles[`tone-${cellTone(ev)}`]}`}>
              {ev >= 0 ? "+" : ""}
              {((ev / capitalDeployed) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
