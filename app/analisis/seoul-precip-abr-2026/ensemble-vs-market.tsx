"use client";

import { useMemo } from "react";
import styles from "./ensemble-vs-market.module.css";

export interface BucketMarket {
  label: string;
  lower: number;
  upper: number | null;
  yesPrice: number;
  noPrice: number;
}

interface Props {
  /** Per-member ensemble totals for the remaining window */
  ensembleTotals: number[];
  /** Baseline MTD added to each member to get the final projected total */
  baseline: number;
  /** Market buckets with bounds and current prices */
  buckets: BucketMarket[];
  /** Threshold over which an EV row is treated as actionable */
  actionableThreshold?: number;
}

type RowComputed = {
  label: string;
  ensembleProb: number;
  members: number;
  yesPrice: number;
  noPrice: number;
  evYes: number;
  evNo: number;
  bestSide: "YES" | "NO";
  bestEv: number;
  bestPrice: number;
  actionable: boolean;
};

export default function EnsembleVsMarket({
  ensembleTotals,
  baseline,
  buckets,
  actionableThreshold = 0.05,
}: Props) {
  const rows: RowComputed[] = useMemo(() => {
    const finals = ensembleTotals.map((v) => v + baseline);
    const N = Math.max(1, finals.length);
    return buckets.map((b) => {
      const members = finals.filter((f) => {
        if (b.upper === null) return f >= b.lower;
        return f >= b.lower && f < b.upper;
      }).length;
      const ensembleProb = members / N;
      const evYes = ensembleProb - b.yesPrice;
      const evNo = 1 - ensembleProb - b.noPrice;
      const bestYes = evYes >= evNo;
      const bestSide: "YES" | "NO" = bestYes ? "YES" : "NO";
      const bestEv = bestYes ? evYes : evNo;
      const bestPrice = bestYes ? b.yesPrice : b.noPrice;
      return {
        label: b.label,
        ensembleProb,
        members,
        yesPrice: b.yesPrice,
        noPrice: b.noPrice,
        evYes,
        evNo,
        bestSide,
        bestEv,
        bestPrice,
        actionable: Math.abs(bestEv) >= actionableThreshold && bestEv > 0,
      };
    });
  }, [ensembleTotals, baseline, buckets, actionableThreshold]);

  // Max absolute EV used to scale the bar
  const maxAbsEv = Math.max(0.01, ...rows.map((r) => Math.abs(r.bestEv)));

  return (
    <div className={styles.wrap}>
      <div className={`${styles.row} ${styles.rowHead}`}>
        <div className={styles.bucketCol}>Bucket</div>
        <div className={styles.probCol}>Ensemble</div>
        <div className={styles.mktCol}>Mercado</div>
        <div className={styles.actionCol}>Sugerencia</div>
        <div className={styles.evCol}>EV</div>
      </div>

      {rows.map((r) => (
        <div
          key={r.label}
          className={`${styles.row} ${r.actionable ? styles.rowActionable : ""}`}
        >
          <div className={styles.bucketCol}>
            <span className={styles.bucketLabel}>{r.label}</span>
          </div>

          <div className={styles.probCol}>
            <div className={styles.probBar}>
              <div
                className={styles.probFill}
                style={{ width: `${r.ensembleProb * 100}%` }}
              />
            </div>
            <span className={styles.probText}>
              {(r.ensembleProb * 100).toFixed(0)}%
              <small className={styles.probMembers}>
                {r.members}/{ensembleTotals.length}
              </small>
            </span>
          </div>

          <div className={styles.mktCol}>
            <div className={styles.mktPrices}>
              <span className={styles.mktPrice}>
                <span className={styles.mktLabel}>YES</span>
                <span className={styles.mktValue}>{(r.yesPrice * 100).toFixed(0)}¢</span>
              </span>
              <span className={styles.mktPrice}>
                <span className={styles.mktLabel}>NO</span>
                <span className={styles.mktValue}>{(r.noPrice * 100).toFixed(0)}¢</span>
              </span>
            </div>
          </div>

          <div className={styles.actionCol}>
            {r.actionable ? (
              <span
                className={`${styles.actionTag} ${r.bestSide === "YES" ? styles.actionYes : styles.actionNo}`}
              >
                Long {r.bestSide}
                <small className={styles.actionPrice}>
                  @ {(r.bestPrice * 100).toFixed(0)}¢
                </small>
              </span>
            ) : (
              <span className={styles.actionNone}>pasa</span>
            )}
          </div>

          <div className={styles.evCol}>
            <div className={styles.evTrack}>
              <div className={styles.evCenter} />
              <div
                className={`${styles.evBar} ${r.bestEv >= 0 ? styles.evPos : styles.evNeg}`}
                style={{
                  width: `${(Math.abs(r.bestEv) / maxAbsEv) * 50}%`,
                  [r.bestEv >= 0 ? "left" : "right"]: "50%",
                }}
              />
            </div>
            <span
              className={`${styles.evValue} ${r.bestEv >= 0 ? styles.evValuePos : styles.evValueNeg}`}
            >
              {r.bestEv >= 0 ? "+" : "−"}
              {Math.abs(r.bestEv * 100).toFixed(0)}¢
            </span>
          </div>
        </div>
      ))}

      <footer className={styles.footer}>
        <span className={styles.footerNote}>
          El ensemble agrupa los 30 escenarios del modelo GFS. La{" "}
          <strong>Sugerencia</strong> indica el lado rentable si la probabilidad
          real estuviese cerca de la del ensemble.
        </span>
      </footer>
    </div>
  );
}
