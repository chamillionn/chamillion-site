"use client";

import { useEffect, useState } from "react";
import styles from "./bucket-strip.module.css";

export interface StripBucket {
  label: string;
  /** Lower bound in mm (inclusive). For "75+" use 75 with upper=null. */
  lower: number;
  upper: number | null;
  yesPrice: number;
  noPrice: number;
}

interface Props {
  /** Current mm (month-to-date) */
  current: number;
  buckets: StripBucket[];
  /** Scale the axis to this max mm (default = last bucket's lower × 1.1) */
  axisMax?: number;
  /** Unit label, default mm */
  unit?: string;
}

/**
 * Horizontal strike-rate strip. Each bucket occupies a proportional slice of
 * the axis. The current value is rendered as a marker that animates into
 * position. The active bucket is highlighted; its live price is called out.
 */
export default function BucketStrip({ current, buckets, axisMax, unit = "mm" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Determine axis range
  const max = axisMax ?? Math.max(buckets[buckets.length - 1].lower * 1.4, current * 1.2);

  // Find active bucket
  const active = buckets.find(
    (b) => current >= b.lower && (b.upper === null || current < b.upper),
  );
  const activeIndex = active ? buckets.indexOf(active) : -1;

  // Compute x% for a given mm value
  const toPct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {buckets.map((b, i) => {
          const start = toPct(b.lower);
          const end = b.upper === null ? 100 : toPct(b.upper);
          const width = Math.max(2, end - start);
          const isActive = i === activeIndex;
          return (
            <div
              key={b.label}
              className={`${styles.segment} ${isActive ? styles.segmentActive : ""}`}
              style={{ left: `${start}%`, width: `${width}%` }}
            >
              <span className={styles.segmentLabel}>{b.label}</span>
            </div>
          );
        })}

        {/* Marker */}
        <div
          className={styles.marker}
          style={{
            left: mounted ? `${toPct(current)}%` : "0%",
            opacity: mounted ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <div className={styles.markerLine} />
          <div className={styles.markerDot} />
        </div>
      </div>

      {/* Readout below the strip */}
      <div className={styles.readout}>
        <div className={styles.readoutLeft}>
          <span className={styles.readoutMm}>
            {current.toFixed(1)}
            <small className={styles.readoutUnit}>{unit}</small>
          </span>
          <span className={styles.readoutHint}>ahora</span>
        </div>
        {active && (
          <div className={styles.readoutRight}>
            <span className={styles.readoutBucketLabel}>en el bucket</span>
            <span className={styles.readoutBucket}>{active.label}</span>
            <div className={styles.readoutPrices}>
              <span className={styles.priceChip + " " + styles.priceYes}>
                <span className={styles.priceLabel}>YES</span>
                <span className={styles.priceValue}>{(active.yesPrice * 100).toFixed(0)}¢</span>
              </span>
              <span className={styles.priceChip + " " + styles.priceNo}>
                <span className={styles.priceLabel}>NO</span>
                <span className={styles.priceValue}>{(active.noPrice * 100).toFixed(0)}¢</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
