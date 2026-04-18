import type { Candle, Timeframe } from "./binance";
import { markTwelveBlocked } from "./twelvedata-usage";

/**
 * Twelve Data provides OHLCV across stocks, forex, indices, commodities,
 * and crypto. Free tier: 800 req/day, 8 req/min. No datacenter-IP blocks
 * (unlike Yahoo Finance).
 *
 * Symbol format examples:
 *   Stocks:     AAPL, NVDA, MSFT
 *   Indices:    SPX (S&P 500), IXIC (Nasdaq), DJI
 *   Forex:      EUR/USD, USD/JPY, GBP/USD
 *   Commodities: XAU/USD (gold), XAG/USD (silver), WTI (oil), CL (crude)
 *   Crypto:     BTC/USD, ETH/USD  — we still route crypto to Binance.
 */
const API = "https://api.twelvedata.com";
const API_KEY_ENV = "TWELVEDATA_API_KEY";

const TF_MAP: Record<Timeframe, string> = {
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

function apiKey(): string {
  const k = process.env[API_KEY_ENV];
  if (!k) throw new Error(`${API_KEY_ENV} not set`);
  return k;
}

interface TDResponse {
  status?: "ok" | "error";
  code?: number;
  message?: string;
  values?: { datetime: string; open: string; high: string; low: string; close: string }[];
}

/** Cache window (seconds). Shared across Vercel serverless instances via
 *  Next.js `fetch` data-cache. 5 minutes for 1h/4h data, 15 minutes for
 *  daily (which barely moves intraday anyway). */
const CACHE_SECONDS: Record<Timeframe, number> = {
  "1h": 300,
  "4h": 600,
  "1d": 900,
};

function parseValues(raw: TDResponse): Candle[] {
  if (raw.status === "error" || !raw.values) {
    // 429 = rate limit (per-minute or daily). Trip the global block.
    if (raw.code === 429) {
      // Daily-limit messages mention 800; minute ones mention "current minute"
      const daily = /daily/i.test(raw.message ?? "");
      markTwelveBlocked(daily ? 60 * 60 * 1000 : 60_000);
    }
    throw new Error(raw.message || "Twelve Data: empty response");
  }
  // Twelve Data returns newest first — we want chronological
  return raw.values
    .map((v) => ({
      time: Math.floor(new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .sort((a, b) => a.time - b.time);
}

export async function fetchTwelveCandles(
  symbol: string,
  interval: Timeframe,
  limit = 512,
): Promise<Candle[]> {
  const tfStr = TF_MAP[interval];
  const url = `${API}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tfStr}&outputsize=${limit}&apikey=${apiKey()}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: CACHE_SECONDS[interval] },
  });
  if (!res.ok) throw new Error(`Twelve Data: HTTP ${res.status}`);

  const raw = (await res.json()) as TDResponse;
  return parseValues(raw);
}

export async function fetchTwelveCandlesByRange(
  symbol: string,
  interval: Timeframe,
  startTimeMs: number,
  endTimeMs: number,
): Promise<Candle[]> {
  const tfStr = TF_MAP[interval];
  const start = new Date(startTimeMs).toISOString().slice(0, 19).replace("T", " ");
  const end = new Date(endTimeMs).toISOString().slice(0, 19).replace("T", " ");
  const url = `${API}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tfStr}&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&apikey=${apiKey()}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Twelve Data: HTTP ${res.status}`);

  const raw = (await res.json()) as TDResponse;
  if (raw.status === "error" || !raw.values) return [];
  return parseValues(raw);
}
