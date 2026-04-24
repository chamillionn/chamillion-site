"use client";

import { useEffect, useState } from "react";
import styles from "./underlying-strip.module.css";

export interface UnderlyingBucket {
  label: string;
  lower: number;
  /** upper=null → open-ended rightmost bucket */
  upper: number | null;
}

interface Props {
  /** Current value to position on the axis */
  current: number;
  unit?: string;
  /** If provided → bucket mode with named segments */
  buckets?: UnderlyingBucket[];
  /** If no buckets, a simple axis from min → max */
  axisMin?: number;
  axisMax?: number;
  /** Single highlighted reference line (e.g. target / threshold) */
  reference?: { value: number; label?: string };
  /** Optional caption above the strip (e.g. source · timestamp) */
  caption?: React.ReactNode;
  /** Second inline label to the right of current value (e.g. "ahora mismo") */
  valueHint?: string;
}

/**
 * Generic horizontal strip for an underlying value — used by analyses of any
 * kind. Two modes:
 *   - Buckets: discrete segments (Polymarket-like prediction markets)
 *   - Continuous: plain axis with a single reference line (price tracking)
 */
export default function UnderlyingStrip({
  current,
  unit = "",
  buckets,
  axisMin,
  axisMax,
  reference,
  caption,
  valueHint,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const bucketMode = buckets && buckets.length > 0;

  const min = axisMin ?? (bucketMode ? 0 : current * 0.8);
  const last = bucketMode ? buckets![buckets!.length - 1] : null;
  const defaultMax = last
    ? Math.max(last.lower * 1.4, current * 1.2)
    : current * 1.2;
  const max = axisMax ?? defaultMax;

  const toPct = (v: number) =>
    ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100;

  const activeIndex = bucketMode
    ? buckets!.findIndex(
        (b) => current >= b.lower && (b.upper === null || current < b.upper),
      )
    : -1;

  return (
    <div className={styles.wrap}>
      {caption && <div className={styles.caption}>{caption}</div>}

      <div className={styles.valueRow}>
        <span className={styles.value}>
          {current.toFixed(1)}
          <span className={styles.unit}>{unit}</span>
        </span>
        {valueHint && <span className={styles.hint}>{valueHint}</span>}
      </div>

      <div className={styles.track}>
        {bucketMode &&
          buckets!.map((b, i) => {
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

        {!bucketMode && <div className={styles.axisLine} />}

        {reference && (
          <div
            className={styles.reference}
            style={{ left: `${toPct(reference.value)}%` }}
          >
            <span className={styles.referenceLabel}>
              {reference.label ?? `${reference.value} ${unit}`}
            </span>
          </div>
        )}

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

      {/* axis ticks (continuous mode only, lightly) */}
      {!bucketMode && (
        <div className={styles.axisTicks}>
          <span>{min.toFixed(0)}</span>
          <span>{max.toFixed(0)}</span>
        </div>
      )}
    </div>
  );
}
