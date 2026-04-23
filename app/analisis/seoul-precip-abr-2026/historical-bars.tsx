"use client";

import { useState } from "react";
import styles from "./historical-bars.module.css";

export interface HistoricalBar {
  label: string;
  value: number;
  detail?: string;
  highlight?: boolean;
}

interface Props {
  data: HistoricalBar[];
  unit?: string;
  /** Horizontal reference line — e.g. decision threshold */
  threshold?: { value: number; label?: string };
  /** Max Y — if omitted, uses 1.1 × max of data */
  max?: number;
  height?: number;
  /** Color tone for bars above/below threshold */
  splitTone?: { above: string; below: string };
  /** Highlight the bar whose label matches */
  activeLabel?: string;
  /** Click on a bar fires with its label */
  onBarClick?: (label: string) => void;
}

export default function HistoricalBars({
  data,
  unit = "",
  threshold,
  max,
  height = 280,
  splitTone,
  activeLabel,
  onBarClick,
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const yMax = max ?? Math.max(...data.map((d) => d.value)) * 1.1;
  const barW = 100 / data.length;

  const barFill = (d: HistoricalBar) => {
    if (splitTone && threshold) {
      return d.value >= threshold.value ? splitTone.above : splitTone.below;
    }
    return d.highlight ? "var(--steel-blue)" : "rgba(var(--steel-blue-rgb), 0.35)";
  };

  return (
    <div className={styles.wrap} style={{ height: `${height + 40}px` }}>
      <svg
        className={styles.svg}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Grid baseline */}
        <line
          x1="0"
          y1={height - 0.5}
          x2="100"
          y2={height - 0.5}
          stroke="var(--border)"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />

        {/* Threshold line */}
        {threshold && (
          <g>
            <line
              x1="0"
              y1={height - (threshold.value / yMax) * height}
              x2="100"
              y2={height - (threshold.value / yMax) * height}
              stroke="rgba(var(--steel-blue-rgb), 0.55)"
              strokeWidth="0.5"
              strokeDasharray="1.2 1.2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const h = (d.value / yMax) * height;
          const x = i * barW + barW * 0.15;
          const w = barW * 0.7;
          const y = height - h;
          const isActive = activeLabel === d.label;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={onBarClick ? () => onBarClick(d.label) : undefined}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={barFill(d)}
                opacity={
                  hoverIdx === null && activeLabel === undefined
                    ? 1
                    : hoverIdx === i || isActive
                      ? 1
                      : 0.35
                }
                rx="0.6"
                style={{ transition: "opacity 180ms" }}
              />
              {isActive && (
                <rect
                  x={x - 0.35}
                  y={y - 0.3}
                  width={w + 0.7}
                  height={h + 0.35}
                  fill="none"
                  stroke="var(--steel-blue)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  rx="0.9"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div className={styles.labels}>
        {data.map((d, i) => {
          const isActive = activeLabel === d.label;
          return (
            <button
              key={i}
              type="button"
              onClick={onBarClick ? () => onBarClick(d.label) : undefined}
              disabled={!onBarClick}
              className={`${styles.label} ${isActive ? styles.labelActive : ""} ${onBarClick ? styles.labelClickable : ""}`}
              style={{ width: `${barW}%` }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Y-axis caption */}
      {threshold && (
        <div
          className={styles.thresholdCaption}
          style={{ top: `${height - (threshold.value / yMax) * height - 10}px` }}
        >
          {threshold.label ?? `${threshold.value}${unit}`}
        </div>
      )}

      {/* Hover tooltip */}
      {hoverIdx !== null && (
        <div
          className={styles.tooltip}
          style={{
            left: `calc(${hoverIdx * barW + barW / 2}% - 70px)`,
            top: `${Math.max(0, height - (data[hoverIdx].value / yMax) * height - 62)}px`,
          }}
        >
          <div className={styles.tooltipLabel}>{data[hoverIdx].label}</div>
          <div className={styles.tooltipValue}>
            {data[hoverIdx].value.toFixed(1)}
            {unit && <span className={styles.tooltipUnit}> {unit}</span>}
          </div>
          {data[hoverIdx].detail && (
            <div className={styles.tooltipDetail}>{data[hoverIdx].detail}</div>
          )}
        </div>
      )}
    </div>
  );
}
