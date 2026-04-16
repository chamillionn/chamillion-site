import type { Candle } from "./binance";

const KRONOS_URL =
  "https://chamillionn--kronos-predictor-kronosservice-api.modal.run";

export interface KronosResult {
  columns: string[];
  data: number[][];
  timestamps: string[];
}

/**
 * Call the Kronos prediction endpoint.
 * Sends OHLCV candles and receives forecast candles.
 */
export async function predict(
  candles: Candle[],
  predictionLength = 24,
): Promise<KronosResult> {
  const body = {
    ohlcv: {
      columns: ["open", "high", "low", "close"],
      data: candles.map((c) => [c.open, c.high, c.low, c.close]),
      timestamps: candles.map((c) =>
        new Date(c.time * 1000).toISOString(),
      ),
    },
    prediction_length: predictionLength,
  };

  const res = await fetch(KRONOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Kronos: HTTP ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Convert Kronos result to Candle array for chart rendering.
 * Timestamps from Kronos come as ISO strings.
 */
export function resultToCandles(result: KronosResult): Candle[] {
  const openIdx = result.columns.indexOf("open");
  const highIdx = result.columns.indexOf("high");
  const lowIdx = result.columns.indexOf("low");
  const closeIdx = result.columns.indexOf("close");

  return result.data.map((row, i) => ({
    time: Math.floor(new Date(result.timestamps[i]).getTime() / 1000),
    open: row[openIdx] ?? row[0],
    high: row[highIdx] ?? row[1],
    low: row[lowIdx] ?? row[2],
    close: row[closeIdx] ?? row[3],
  }));
}
