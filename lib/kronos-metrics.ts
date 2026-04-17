import type { Candle } from "./binance";

/**
 * Pure functions to compare predicted vs actual candles.
 * All functions align arrays by index up to min(len(predicted), len(actual)).
 */

function align(predicted: Candle[], actual: Candle[]): { p: Candle[]; a: Candle[] } {
  const n = Math.min(predicted.length, actual.length);
  return { p: predicted.slice(0, n), a: actual.slice(0, n) };
}

/** Mean Absolute Error on close prices (USD). */
export function computeMAE(predicted: Candle[], actual: Candle[]): number | null {
  const { p, a } = align(predicted, actual);
  if (p.length === 0) return null;
  const sum = p.reduce((acc, pc, i) => acc + Math.abs(pc.close - a[i].close), 0);
  return sum / p.length;
}

/** Mean Absolute Percentage Error (0-1 scale). */
export function computeMAPE(predicted: Candle[], actual: Candle[]): number | null {
  const { p, a } = align(predicted, actual);
  if (p.length === 0) return null;
  const sum = p.reduce((acc, pc, i) => {
    if (a[i].close === 0) return acc;
    return acc + Math.abs((pc.close - a[i].close) / a[i].close);
  }, 0);
  return sum / p.length;
}

/**
 * Directional accuracy: % of candles where predicted direction (vs previous)
 * matches actual direction. Returns 0-1.
 */
export function directionalAccuracy(
  predicted: Candle[],
  actual: Candle[],
  lastKnownClose: number,
): number | null {
  const { p, a } = align(predicted, actual);
  if (p.length === 0) return null;

  let hits = 0;
  let prevPredClose = lastKnownClose;
  let prevActualClose = lastKnownClose;

  for (let i = 0; i < p.length; i++) {
    const predDir = Math.sign(p[i].close - prevPredClose);
    const actDir = Math.sign(a[i].close - prevActualClose);
    if (predDir === actDir) hits++;
    prevPredClose = p[i].close;
    prevActualClose = a[i].close;
  }

  return hits / p.length;
}

/**
 * Range hit rate: % of actual closes that fall within predicted [low, high] band.
 * Returns 0-1.
 */
export function rangeHitRate(predicted: Candle[], actual: Candle[]): number | null {
  const { p, a } = align(predicted, actual);
  if (p.length === 0) return null;
  let hits = 0;
  for (let i = 0; i < p.length; i++) {
    if (a[i].close >= p[i].low && a[i].close <= p[i].high) hits++;
  }
  return hits / p.length;
}

export interface KronosMetrics {
  mae: number | null;
  mape: number | null; // 0-1
  directional: number | null; // 0-1
  rangeHit: number | null; // 0-1
  candlesCompared: number;
  candlesExpected: number;
  progressPct: number; // 0-1
}

export function computeAllMetrics(
  predicted: Candle[],
  actual: Candle[],
  lastKnownClose: number,
): KronosMetrics {
  const compared = Math.min(predicted.length, actual.length);
  return {
    mae: computeMAE(predicted, actual),
    mape: computeMAPE(predicted, actual),
    directional: directionalAccuracy(predicted, actual, lastKnownClose),
    rangeHit: rangeHitRate(predicted, actual),
    candlesCompared: compared,
    candlesExpected: predicted.length,
    progressPct: predicted.length > 0 ? compared / predicted.length : 0,
  };
}
