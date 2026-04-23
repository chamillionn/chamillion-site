"use client";

import { useState } from "react";
import type { BucketHighlight } from "./data";
import styles from "./market-table.module.css";

export interface MarketRow {
  range: string;
  impliedProb: number;
  myProb: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
  highlight?: BucketHighlight;
}

interface Props {
  rows: MarketRow[];
  eventUrl: string;
}

const HIGHLIGHT_LABEL: Record<NonNullable<MarketRow["highlight"]>, string> = {
  "long-yes": "Compro YES",
  "long-no": "Compro NO",
  warn: "Caro",
};

function formatUsd(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function cent(v: number) {
  return `${(v * 100).toFixed(0)}¢`;
}

export default function MarketTable({ rows, eventUrl }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.headCol}>Outcome</div>
        <div className={styles.headColRight}>Chance</div>
        <div className={styles.headColRight}>Buy Yes</div>
        <div className={styles.headColRight}>Buy No</div>
        <div className={styles.headColRight}>Vol.</div>
      </header>

      <ul className={styles.rows}>
        {rows.map((r, i) => (
          <li
            key={r.range}
            className={`${styles.row} ${hover === i ? styles.rowHover : ""} ${r.highlight ? styles[`row-${r.highlight}`] : ""}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className={styles.colOutcome}>
              <span className={styles.rangeLabel}>{r.range}</span>
              {r.highlight && (
                <span className={`${styles.tag} ${styles[`tag-${r.highlight}`]}`}>
                  {HIGHLIGHT_LABEL[r.highlight]}
                </span>
              )}
            </div>

            <div className={styles.colChance}>
              <div className={styles.chanceWrap}>
                <div className={styles.chanceBar}>
                  <div
                    className={styles.chanceFill}
                    style={{ width: `${r.impliedProb * 100}%` }}
                  />
                  {Math.abs(r.impliedProb - r.myProb) > 0.04 && (
                    <div
                      className={styles.chanceMyMark}
                      style={{ left: `${r.myProb * 100}%` }}
                      title={`Mi probabilidad estimada: ${pct(r.myProb)}`}
                    />
                  )}
                </div>
                <span className={styles.chanceText}>{pct(r.impliedProb)}</span>
              </div>
            </div>

            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.priceButton} ${styles.priceYes}`}
              aria-label={`Comprar YES a ${cent(r.yesPrice)}`}
            >
              <span className={styles.priceLabel}>Buy Yes</span>
              <span className={styles.priceValue}>{cent(r.yesPrice)}</span>
            </a>

            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.priceButton} ${styles.priceNo}`}
              aria-label={`Comprar NO a ${cent(r.noPrice)}`}
            >
              <span className={styles.priceLabel}>Buy No</span>
              <span className={styles.priceValue}>{cent(r.noPrice)}</span>
            </a>

            <div className={styles.colVol}>{formatUsd(r.volume)}</div>
          </li>
        ))}
      </ul>

      <footer className={styles.foot}>
        <span className={styles.footLegend}>
          <span className={styles.legendSwatch} /> lo que el mercado piensa
        </span>
        <span className={styles.footLegend}>
          <span className={styles.legendMark} /> lo que yo pienso
        </span>
        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footLink}
        >
          Ver en Polymarket ↗
        </a>
      </footer>
    </div>
  );
}
