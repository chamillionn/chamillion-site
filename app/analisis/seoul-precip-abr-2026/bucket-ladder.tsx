"use client";

import { useState } from "react";
import styles from "./bucket-ladder.module.css";

export interface BucketRow {
  range: string;
  impliedProb: number; // 0-1
  myProb: number; // 0-1
  yesPrice: number;
  noPrice: number;
  volume: number;
  highlight?: "long-yes" | "long-no" | "warn";
}

interface Props {
  rows: BucketRow[];
}

const HIGHLIGHT_LABEL: Record<NonNullable<BucketRow["highlight"]>, string> = {
  "long-yes": "Long YES",
  "long-no": "Long NO",
  warn: "Caro",
};

export default function BucketLadder({ rows }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className={styles.ladder}>
      <div className={`${styles.head} ${styles.row}`}>
        <div className={styles.cellRange}>Bucket</div>
        <div className={styles.cellBar}>Implied vs real</div>
        <div className={styles.cellPrice}>YES</div>
        <div className={styles.cellPrice}>NO</div>
        <div className={styles.cellVol}>Vol</div>
        <div className={styles.cellTag}></div>
      </div>

      {rows.map((r, i) => {
        const pctImplied = Math.min(1, r.impliedProb);
        const pctMine = Math.min(1, r.myProb);
        const mispricingPct = r.impliedProb - r.myProb;
        const mispricingTone =
          mispricingPct > 0.1 ? "overpriced" : mispricingPct < -0.1 ? "underpriced" : "fair";
        return (
          <div
            key={i}
            className={`${styles.row} ${hover === i ? styles.rowHover : ""} ${r.highlight ? styles[`highlight-${r.highlight}`] : ""}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className={styles.cellRange}>
              <span className={styles.rangeLabel}>{r.range}</span>
            </div>

            <div className={styles.cellBar}>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barImplied} ${styles[`tone-${mispricingTone}`]}`}
                  style={{ width: `${pctImplied * 100}%` }}
                />
                <div
                  className={styles.barMine}
                  style={{ width: `${pctMine * 100}%` }}
                />
              </div>
              <div className={styles.barMeta}>
                <span className={styles.metaMarket}>mkt {(r.impliedProb * 100).toFixed(0)}%</span>
                <span className={styles.metaMine}>real {(r.myProb * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className={styles.cellPrice}>
              <span className={styles.priceVal}>${r.yesPrice.toFixed(2)}</span>
            </div>
            <div className={styles.cellPrice}>
              <span className={styles.priceVal}>${r.noPrice.toFixed(2)}</span>
            </div>
            <div className={styles.cellVol}>
              <span className={styles.volVal}>${(r.volume / 1000).toFixed(1)}k</span>
            </div>
            <div className={styles.cellTag}>
              {r.highlight && (
                <span className={`${styles.tag} ${styles[`tag-${r.highlight}`]}`}>
                  {HIGHLIGHT_LABEL[r.highlight]}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className={styles.legend}>
        <span className={styles.legendKey}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchImplied}`} /> precio mercado
        </span>
        <span className={styles.legendKey}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchMine}`} /> mi probabilidad
        </span>
      </div>
    </div>
  );
}
