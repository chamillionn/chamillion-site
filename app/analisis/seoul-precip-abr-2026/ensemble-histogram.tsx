"use client";

import { useState } from "react";
import styles from "./ensemble-histogram.module.css";

interface Props {
  totals: number[];          // per-member final total value
  threshold?: number;        // decision threshold (resolves the market)
  binSize?: number;
  unit?: string;
  height?: number;
}

/**
 * Histogram of per-member final totals with a threshold divider.
 * Bins above threshold are colored red-ish, below are steel-blue.
 */
export default function EnsembleHistogram({
  totals,
  threshold,
  binSize = 5,
  unit = "mm",
  height = 200,
}: Props) {
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  if (totals.length === 0) return null;

  const min = Math.floor(Math.min(...totals) / binSize) * binSize;
  const max = Math.ceil(Math.max(...totals) / binSize) * binSize;
  const numBins = Math.max(1, Math.round((max - min) / binSize));

  const counts = new Array(numBins).fill(0);
  totals.forEach((v) => {
    const idx = Math.min(numBins - 1, Math.max(0, Math.floor((v - min) / binSize)));
    counts[idx] += 1;
  });
  const maxCount = Math.max(...counts);

  const thresholdBinIdx =
    threshold != null
      ? Math.max(0, Math.min(numBins, Math.floor((threshold - min) / binSize)))
      : -1;

  const binW = 100 / numBins;

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        {/* Threshold line */}
        {threshold != null && (
          <line
            x1={thresholdBinIdx * binW}
            y1="0"
            x2={thresholdBinIdx * binW}
            y2={height}
            stroke="rgba(var(--steel-blue-rgb), 0.8)"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {counts.map((c, i) => {
          const h = (c / maxCount) * (height - 10);
          const x = i * binW + 0.3;
          const w = binW - 0.6;
          const y = height - h;
          const aboveThreshold = threshold != null && min + (i + 1) * binSize > threshold;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverBin(i)}
              onMouseLeave={() => setHoverBin(null)}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(0.2, h)}
                fill={
                  aboveThreshold
                    ? "rgba(199, 85, 90, 0.65)"
                    : "rgba(var(--steel-blue-rgb), 0.65)"
                }
                opacity={hoverBin === null || hoverBin === i ? 1 : 0.55}
                rx="0.6"
                style={{ cursor: "pointer", transition: "opacity 160ms" }}
              />
              {c > 0 && (
                <text
                  x={x + w / 2}
                  y={y - 2}
                  fontSize="3.6"
                  fill="var(--text-muted)"
                  textAnchor="middle"
                  fontFamily="var(--font-dm-mono), monospace"
                >
                  {c}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className={styles.axis}>
        {Array.from({ length: numBins + 1 }, (_, i) => {
          const v = min + i * binSize;
          // only label every other tick if many bins
          const skip = numBins > 10 && i % 2 !== 0 && i !== numBins;
          return (
            <span
              key={i}
              className={styles.tick}
              style={{ left: `${i * binW}%` }}
            >
              {!skip ? v : ""}
            </span>
          );
        })}
      </div>

      {threshold != null && (
        <div
          className={styles.thresholdCap}
          style={{ left: `${thresholdBinIdx * binW}%` }}
        >
          {threshold}{unit}
        </div>
      )}

      {hoverBin !== null && (
        <div
          className={styles.tooltip}
          style={{
            left: `calc(${hoverBin * binW + binW / 2}% - 55px)`,
          }}
        >
          <span className={styles.tooltipRange}>
            {(min + hoverBin * binSize).toFixed(0)}–{(min + (hoverBin + 1) * binSize).toFixed(0)} {unit}
          </span>
          <span className={styles.tooltipCount}>
            {counts[hoverBin]} miembro{counts[hoverBin] !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
