import type { Candle, Timeframe } from "./binance";

/**
 * Yahoo Finance unofficial OHLCV endpoint.
 *
 * We use this for symbols that Twelvedata blocks behind a paid plan —
 * primarily commodity futures like HG=F (copper), GC=F (gold), CL=F (WTI),
 * BZ=F (Brent). Stocks / indices / forex usually live better on Twelvedata.
 *
 * Limitations:
 *   - Unofficial endpoint: no SLA, rate limits are not documented and have
 *     become noticeably tighter since 2024 (reports of 429s around 300-360
 *     req/h per IP). Callers should backoff and cache aggressively.
 *   - No 4h timeframe natively. We expose only "1h" and "1d" here; the
 *     asset registry should NOT list 4h for Yahoo-sourced assets.
 *   - Range limits per interval:
 *       1h  → up to ~730 days (Yahoo often trims to 730d)
 *       1d  → effectively unlimited ("max" or multi-year ranges)
 */

const API = "https://query1.finance.yahoo.com/v8/finance/chart";

export type YahooTimeframe = Extract<Timeframe, "1h" | "1d">;

const TF_INTERVAL: Record<YahooTimeframe, string> = {
  "1h": "60m",
  "1d": "1d",
};

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

function assertYahooTf(tf: Timeframe): YahooTimeframe {
  if (tf === "1h" || tf === "1d") return tf;
  throw new Error(`Yahoo source does not support timeframe ${tf} — use 1h or 1d`);
}

function parseResponse(json: YahooChartResponse): Candle[] {
  const result = json.chart?.result?.[0];
  if (!result || !result.timestamp) return [];
  const ts = result.timestamp;
  const q = result.indicators?.quote?.[0];
  if (!q) return [];
  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    // Skip rows where any OHLC is null (Yahoo pads with nulls during gaps)
    if (o == null || h == null || l == null || c == null) continue;
    out.push({
      time: ts[i],
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(c),
    });
  }
  return out;
}

/**
 * Fetch the most recent N candles for a symbol.
 * Yahoo doesn't support "limit" directly — we request a range wide enough to
 * cover N bars of the requested interval, then slice.
 */
export async function fetchYahooCandles(
  symbol: string,
  tf: Timeframe,
  limit = 512,
): Promise<Candle[]> {
  const ytf = assertYahooTf(tf);
  const interval = TF_INTERVAL[ytf];
  // Pick a safe range per interval. Yahoo enforces caps; go conservative.
  const range = ytf === "1h" ? "720d" : "10y";
  const url = `${API}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: {
      // Yahoo 429s requests with missing/weird user agents. Use a plain UA.
      "User-Agent":
        "Mozilla/5.0 (compatible; Chamillion/1.0; +https://chamillion.site)",
    },
    next: { revalidate: ytf === "1h" ? 300 : 900 },
  });
  if (!res.ok) {
    throw new Error(`Yahoo ${symbol}: HTTP ${res.status}`);
  }
  const json = (await res.json()) as YahooChartResponse;
  const err = json.chart?.error;
  if (err) throw new Error(`Yahoo ${symbol}: ${err.description}`);
  const candles = parseResponse(json);
  return candles.slice(-limit);
}

/**
 * Fetch candles for an explicit [startSec, endSec) unix-seconds range.
 */
export async function fetchYahooCandlesByRange(
  symbol: string,
  tf: Timeframe,
  startSec: number,
  endSec: number,
): Promise<Candle[]> {
  const ytf = assertYahooTf(tf);
  const interval = TF_INTERVAL[ytf];
  const url = `${API}/${encodeURIComponent(symbol)}?interval=${interval}&period1=${Math.floor(startSec)}&period2=${Math.floor(endSec)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Chamillion/1.0; +https://chamillion.site)",
    },
    next: { revalidate: ytf === "1h" ? 300 : 900 },
  });
  if (!res.ok) {
    throw new Error(`Yahoo ${symbol}: HTTP ${res.status}`);
  }
  const json = (await res.json()) as YahooChartResponse;
  const err = json.chart?.error;
  if (err) throw new Error(`Yahoo ${symbol}: ${err.description}`);
  return parseResponse(json);
}
