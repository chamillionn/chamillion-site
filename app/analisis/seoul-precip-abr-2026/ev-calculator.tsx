"use client";

import { useState } from "react";
import styles from "./ev-calculator.module.css";

export interface EVLeg {
  name: string;
  /** "yes" or "no" — direction of the contract */
  side: "yes" | "no";
  /** Entry price per contract (0-1) */
  price: number;
  /** Notional capital allocated to this leg, in currency units */
  notional: number;
  /** Probability of THIS leg's YES outcome at the default assumed P (0-1) */
  anchorP: number;
}

interface Props {
  legs: EVLeg[];
  /** Default probability for the core thesis to drive with the slider (0-1) */
  defaultP?: number;
  /** Function mapping a slider P → anchorP for each leg, defaults to (p) => leg.anchorP·(p/defaultP) */
  currency?: string;
}

export default function EVCalculator({
  legs,
  defaultP = 0.75,
  currency = "$",
}: Props) {
  const [p, setP] = useState(defaultP);

  // Scale each leg's anchor probability linearly with the slider, capped at [0, 1]
  const scaledLegs = legs.map((leg) => {
    const scale = defaultP > 0 ? p / defaultP : 1;
    const scaledYesP = Math.min(1, Math.max(0, leg.anchorP * scale));
    // For NO legs, "outcome prob" (they win when NOT YES) = 1 - scaledYesP
    const outcomeP = leg.side === "yes" ? scaledYesP : 1 - scaledYesP;
    const contracts = leg.notional / leg.price;
    const evPerContract = outcomeP * 1 - leg.price;
    const evLeg = evPerContract * contracts;
    const roiLeg = (evLeg / leg.notional) * 100;
    return { leg, outcomeP, contracts, evLeg, roiLeg };
  });

  const totalNotional = legs.reduce((a, b) => a + b.notional, 0);
  const totalEV = scaledLegs.reduce((acc, l) => acc + l.evLeg, 0);
  const totalROI = (totalEV / totalNotional) * 100;

  const breakEvenP = (() => {
    // Binary search on p for totalEV = 0
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const scale = defaultP > 0 ? mid / defaultP : 1;
      const ev = legs.reduce((acc, leg) => {
        const scaled = Math.min(1, Math.max(0, leg.anchorP * scale));
        const op = leg.side === "yes" ? scaled : 1 - scaled;
        const contracts = leg.notional / leg.price;
        return acc + (op * 1 - leg.price) * contracts;
      }, 0);
      if (ev > 0) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.labelCol}>
          <span className={styles.label}>P real asumida</span>
          <div className={styles.valueLine}>
            <span className={styles.value}>{(p * 100).toFixed(0)}%</span>
            <span className={styles.valueHint}>desliza para recalcular</span>
          </div>
        </div>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>EV total</span>
            <span
              className={`${styles.sumValue} ${totalEV >= 0 ? styles.positive : styles.negative}`}
            >
              {totalEV >= 0 ? "+" : "−"}
              {currency}
              {Math.abs(totalEV).toLocaleString("es-ES", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>ROI</span>
            <span
              className={`${styles.sumValue} ${totalROI >= 0 ? styles.positive : styles.negative}`}
            >
              {totalROI >= 0 ? "+" : ""}
              {totalROI.toFixed(0)}%
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>Break-even</span>
            <span className={styles.sumValue}>{(breakEvenP * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className={styles.sliderWrap}>
        <input
          type="range"
          min={0.3}
          max={0.95}
          step={0.01}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          className={styles.slider}
          aria-label="Probabilidad real asumida"
        />
        <div className={styles.sliderTrackLabels}>
          <span>30%</span>
          <span>BE {(breakEvenP * 100).toFixed(0)}%</span>
          <span>95%</span>
        </div>
      </div>

      <div className={styles.legs}>
        {scaledLegs.map((s, i) => (
          <div key={i} className={styles.legRow}>
            <div className={styles.legName}>
              <span className={styles.legTitle}>{s.leg.name}</span>
              <span className={styles.legMeta}>
                {s.leg.side.toUpperCase()} @ {currency}
                {s.leg.price.toFixed(2)} · {currency}
                {s.leg.notional.toLocaleString("es-ES")} notional
              </span>
            </div>
            <div className={styles.legPercent}>
              P out: <strong>{(s.outcomeP * 100).toFixed(0)}%</strong>
            </div>
            <div
              className={`${styles.legEv} ${s.evLeg >= 0 ? styles.positive : styles.negative}`}
            >
              {s.evLeg >= 0 ? "+" : "−"}
              {currency}
              {Math.abs(s.evLeg).toLocaleString("es-ES", { maximumFractionDigits: 0 })}
            </div>
            <div
              className={`${styles.legRoi} ${s.roiLeg >= 0 ? styles.positive : styles.negative}`}
            >
              {s.roiLeg >= 0 ? "+" : ""}
              {s.roiLeg.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
