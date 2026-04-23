"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Analysis,
  AnalysisObservation,
  AnalysisPublic,
} from "@/lib/supabase/types";
import styles from "./prediction-chart.module.css";

function dateToUnixSec(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function formatValue(v: number, unit: string | null) {
  const formatted = v.toLocaleString("es-ES", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export default function PredictionChart({
  analysis,
  observations,
}: {
  analysis: Analysis | AnalysisPublic;
  observations: AnalysisObservation[];
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!analysis.has_prediction) return;
    const startDate = analysis.prediction_start_date;
    const baseline = analysis.prediction_baseline_value;
    if (!startDate || baseline == null) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { createChart, ColorType, LineSeries, LineStyle } = await import(
        "lightweight-charts"
      );
      if (disposed || !chartRef.current) return;

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 320,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: isDark ? "#8B9099" : "#4a3f35",
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 11,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: isDark ? "#1E222922" : "#c9b89f44" },
          horzLines: { color: isDark ? "#1E222922" : "#c9b89f44" },
        },
        crosshair: {
          vertLine: { color: isDark ? "#6B8EA050" : "#2b5d7380" },
          horzLine: { color: isDark ? "#6B8EA050" : "#2b5d7380" },
        },
        timeScale: { borderColor: isDark ? "#1E2229" : "#b5a48c", timeVisible: false },
        rightPriceScale: { borderColor: isDark ? "#1E2229" : "#b5a48c" },
      });

      // Prediction line: baseline → target (or flat if no target)
      const predColor = isDark ? "#6B8EA0" : "#2b5d73";
      const predSeries = chart.addSeries(LineSeries, {
        color: predColor,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        crosshairMarkerVisible: true,
        title: "Predicción",
      });

      const startT = dateToUnixSec(startDate);
      const endT = analysis.prediction_end_date
        ? dateToUnixSec(analysis.prediction_end_date)
        : startT + 60 * 60 * 24 * 365;
      const target =
        analysis.prediction_target_value ??
        (analysis.prediction_direction === "bullish"
          ? baseline * 1.25
          : analysis.prediction_direction === "bearish"
            ? baseline * 0.8
            : baseline);

      predSeries.setData([
        { time: startT as never, value: baseline },
        { time: endT as never, value: target },
      ]);

      // Reality line from observations.
      if (observations.length > 0) {
        const realColor = isDark ? "#5BAA7C" : "#2a7348";
        const realSeries = chart.addSeries(LineSeries, {
          color: realColor,
          lineWidth: 2,
          crosshairMarkerRadius: 4,
          title: "Realidad",
        });
        realSeries.setData(
          observations
            .map((o) => ({
              time: dateToUnixSec(o.observed_at) as never,
              value: Number(o.value),
            }))
            .sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number)),
        );
      }

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (chartRef.current) {
          chart.applyOptions({ width: chartRef.current.clientWidth });
        }
      });
      ro.observe(chartRef.current);

      cleanup = () => {
        ro.disconnect();
        chart.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [analysis, observations, isDark]);

  if (!analysis.has_prediction) return null;

  const latest = observations.length > 0 ? observations[observations.length - 1] : null;
  const baseline = analysis.prediction_baseline_value;
  const target = analysis.prediction_target_value;
  const unit = analysis.prediction_unit;

  const latestDelta =
    latest && baseline != null
      ? ((Number(latest.value) - baseline) / baseline) * 100
      : null;
  const deltaPositive = latestDelta != null && latestDelta >= 0;
  const directionIsUp = analysis.prediction_direction === "bullish";
  const alignsWithThesis =
    latestDelta != null
      ? (directionIsUp && deltaPositive) ||
        (!directionIsUp && !deltaPositive && analysis.prediction_direction === "bearish")
      : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Seguimiento de predicción</div>
          <div className={styles.assetLine}>
            {analysis.prediction_direction && (
              <span
                className={`${styles.directionPill} ${styles[`dir-${analysis.prediction_direction}`]}`}
              >
                {analysis.prediction_direction}
              </span>
            )}
            {analysis.prediction_asset && (
              <span className={styles.assetSymbol}>{analysis.prediction_asset}</span>
            )}
          </div>
        </div>
        <div className={styles.stats}>
          {baseline != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Baseline</span>
              <span className={styles.statValue}>{formatValue(baseline, unit)}</span>
            </div>
          )}
          {target != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Objetivo</span>
              <span className={styles.statValue}>{formatValue(target, unit)}</span>
            </div>
          )}
          {latest && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Actual</span>
              <span className={styles.statValue}>
                {formatValue(Number(latest.value), unit)}
              </span>
            </div>
          )}
          {latestDelta != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Δ</span>
              <span
                className={`${styles.statValue} ${
                  alignsWithThesis === null
                    ? ""
                    : alignsWithThesis
                      ? styles.deltaWith
                      : styles.deltaAgainst
                }`}
              >
                {latestDelta >= 0 ? "+" : ""}
                {latestDelta.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
      <div ref={chartRef} className={styles.chart} />
      {observations.length === 0 && (
        <div className={styles.emptyHint}>
          Aún sin observaciones. Se actualizará cuando haya datos.
        </div>
      )}
    </div>
  );
}
