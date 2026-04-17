import type { Candle } from "./binance";

/** Calls our own proxy route, which forwards to Modal server-side. */
const KRONOS_URL = "/api/kronos/predict";

export type KronosModel = "mini" | "small" | "base";

export interface KronosModelInfo {
  id: KronosModel;
  label: string;
  params: string;
  contextLen: number;
  description: string;
}

export const KRONOS_MODELS: KronosModelInfo[] = [
  {
    id: "mini",
    label: "Mini",
    params: "4.1M",
    contextLen: 2048,
    description: "Ligero, contexto extenso (2048 velas). Ideal para tendencias largas.",
  },
  {
    id: "small",
    label: "Small",
    params: "24.7M",
    contextLen: 512,
    description: "Balance entre velocidad y precisión. El modelo por defecto.",
  },
  {
    id: "base",
    label: "Base",
    params: "102.3M",
    contextLen: 512,
    description: "Modelo grande, mayor precisión. Mas lento y costoso.",
  },
];

export interface KronosResult {
  columns: string[];
  data: number[][];
  timestamps: string[];
  model?: string;
}

/**
 * Call the Kronos prediction endpoint.
 * Sends OHLCV candles and receives forecast candles.
 */
export async function predict(
  candles: Candle[],
  predictionLength = 24,
  model: KronosModel = "small",
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
    model_size: model,
  };

  const res = await fetch(KRONOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.detail || err.error || `Kronos: HTTP ${res.status}`);
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
