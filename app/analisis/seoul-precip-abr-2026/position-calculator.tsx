"use client";

import { useState, useMemo } from "react";
import styles from "./position-calculator.module.css";

export interface PositionLeg {
  name: string;
  subtitle?: string;
  side: "yes" | "no";
  price: number;
  /** Scenario keys where this leg wins (serializable for RSC). */
  winsOn: string[];
}

export interface Scenario {
  label: string;
  probability: number;
  /** Key used by `wins()` */
  key: string;
}

interface Props {
  legs: PositionLeg[];
  scenarios: Scenario[];
  /** Default total capital in USD */
  defaultCapital?: number;
  /** Default allocation fraction per leg (sums to 1) */
  defaultAllocation?: number[];
  currency?: string;
}

function format(v: number, currency = "$") {
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v).toLocaleString("es-ES", { maximumFractionDigits: 0 });
  return `${sign}${currency}${abs}`;
}

export default function PositionCalculator({
  legs,
  scenarios,
  defaultCapital = 1000,
  defaultAllocation,
  currency = "$",
}: Props) {
  const [capital, setCapital] = useState(defaultCapital);
  const initial = defaultAllocation ?? legs.map(() => 1 / legs.length);
  const [alloc, setAlloc] = useState<number[]>(initial);

  const sumAlloc = alloc.reduce((a, b) => a + b, 0);
  // Normalize so slider changes don't produce totals > 1
  const normAlloc = alloc.map((v) => v / Math.max(sumAlloc, 0.0001));
  const notionalByLeg = normAlloc.map((fr) => fr * capital);

  function updateLeg(index: number, newVal: number) {
    setAlloc((prev) => {
      const copy = [...prev];
      copy[index] = Math.max(0, Math.min(1, newVal));
      return copy;
    });
  }

  const computed = useMemo(() => {
    // Per scenario: sum PnL across legs
    const rows = scenarios.map((s) => {
      const legPnl = legs.map((leg, i) => {
        const n = notionalByLeg[i];
        if (n <= 0) return 0;
        const wins = leg.winsOn.includes(s.key);
        if (wins) return n / leg.price - n;
        return -n;
      });
      const total = legPnl.reduce((a, b) => a + b, 0);
      return { scenario: s, legPnl, total };
    });
    const ev = rows.reduce((acc, r) => acc + r.scenario.probability * r.total, 0);
    const bestCase = Math.max(...rows.map((r) => r.total));
    const worstCase = Math.min(...rows.map((r) => r.total));
    return { rows, ev, bestCase, worstCase };
  }, [legs, scenarios, notionalByLeg]);

  const evPctRoi = capital > 0 ? (computed.ev / capital) * 100 : 0;
  const maxAbs = Math.max(
    Math.abs(computed.bestCase),
    Math.abs(computed.worstCase),
  );

  return (
    <div className={styles.wrap}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.capitalInput}>
          <label htmlFor="pos-cap" className={styles.capitalLabel}>
            ¿Cuánto quieres poner?
          </label>
          <div className={styles.capitalRow}>
            <span className={styles.capitalCurrency}>{currency}</span>
            <input
              id="pos-cap"
              type="number"
              min="50"
              step="50"
              value={capital}
              onChange={(e) => setCapital(Math.max(0, Number(e.target.value)))}
              className={styles.capitalField}
            />
          </div>
        </div>

        <div className={styles.allocations}>
          <div className={styles.allocHeader}>Reparto</div>
          {legs.map((leg, i) => (
            <div key={i} className={styles.legRow}>
              <div className={styles.legMeta}>
                <span className={styles.legName}>{leg.name}</span>
                {leg.subtitle && (
                  <span className={styles.legSub}>{leg.subtitle}</span>
                )}
              </div>
              <div className={styles.legControl}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={alloc[i]}
                  onChange={(e) => updateLeg(i, Number(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.legNotional}>
                  {format(notionalByLeg[i], currency)}
                  <span className={styles.legPct}>
                    {(normAlloc[i] * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div className={styles.scenarios}>
        <div className={styles.scenariosHead}>
          <span>Escenario</span>
          <span className={styles.scenariosHeadProb}>Prob.</span>
          <span className={styles.scenariosHeadPnl}>Ganas / pierdes</span>
        </div>
        {computed.rows.map((r, i) => {
          const pct =
            maxAbs > 0 ? Math.max(4, Math.min(100, (Math.abs(r.total) / maxAbs) * 100)) : 0;
          const positive = r.total >= 0;
          return (
            <div key={i} className={styles.scenarioRow}>
              <span className={styles.scenarioLabel}>{r.scenario.label}</span>
              <span className={styles.scenarioProb}>
                {(r.scenario.probability * 100).toFixed(0)}%
              </span>
              <div className={styles.pnlTrack}>
                <div className={styles.pnlCenter} />
                <div
                  className={`${styles.pnlBar} ${positive ? styles.pnlPos : styles.pnlNeg}`}
                  style={{
                    width: `${pct / 2}%`,
                    [positive ? "left" : "right"]: "50%",
                  }}
                />
                <span
                  className={`${styles.pnlValue} ${positive ? styles.pnlValuePos : styles.pnlValueNeg}`}
                  style={{
                    [positive ? "left" : "right"]:
                      `calc(50% + ${pct / 2 + 4}%)`,
                  }}
                >
                  {format(r.total, currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>EV esperado</span>
          <span
            className={`${styles.summaryValue} ${computed.ev >= 0 ? styles.pos : styles.neg}`}
          >
            {format(computed.ev, currency)}
          </span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>ROI esperado</span>
          <span
            className={`${styles.summaryValue} ${evPctRoi >= 0 ? styles.pos : styles.neg}`}
          >
            {evPctRoi >= 0 ? "+" : ""}
            {evPctRoi.toFixed(0)}%
          </span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Mejor escenario</span>
          <span className={`${styles.summaryValue} ${styles.pos}`}>
            {format(computed.bestCase, currency)}
          </span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Peor escenario</span>
          <span className={`${styles.summaryValue} ${styles.neg}`}>
            {format(computed.worstCase, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
