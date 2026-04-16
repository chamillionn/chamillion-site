const BINANCE_API = "https://data-api.binance.vision/api/v3";

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Timeframe = "1h" | "4h" | "1d";

const TF_LABELS: Record<Timeframe, string> = {
  "1h": "1 Hora",
  "4h": "4 Horas",
  "1d": "1 Día",
};

export function getTimeframeLabel(tf: Timeframe): string {
  return TF_LABELS[tf];
}

export const TIMEFRAMES: Timeframe[] = ["1h", "4h", "1d"];

/**
 * Fetch OHLCV candles from Binance public API.
 * No API key needed.
 */
export async function fetchCandles(
  symbol: string,
  interval: Timeframe,
  limit = 512,
): Promise<Candle[]> {
  const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance: HTTP ${res.status}`);

  const raw: unknown[][] = await res.json();

  return raw.map((k) => ({
    time: Math.floor((k[0] as number) / 1000), // ms → seconds
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
  }));
}

export interface TradingPair {
  symbol: string; // e.g. "BTCUSDT"
  base: string;   // e.g. "BTC"
}

// Top pairs to show as favorites (before the full list)
const FAVORITES = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOT",
  "LINK", "MATIC", "UNI", "AAVE", "DOGE", "ARB", "OP",
  "SUI", "APT", "NEAR", "ATOM", "FTM",
];

/**
 * Fetch all active USDT trading pairs from Binance.
 * Cached in-memory (pairs don't change often).
 */
let _pairsCache: TradingPair[] | null = null;

export async function fetchPairs(): Promise<TradingPair[]> {
  if (_pairsCache) return _pairsCache;

  const url = `${BINANCE_API}/exchangeInfo?permissions=SPOT`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance exchangeInfo: HTTP ${res.status}`);

  const data = await res.json();

  const pairs: TradingPair[] = (data.symbols as { symbol: string; baseAsset: string; quoteAsset: string; status: string }[])
    .filter((s) => s.quoteAsset === "USDT" && s.status === "TRADING")
    .map((s) => ({ symbol: s.symbol, base: s.baseAsset }))
    .sort((a, b) => {
      const aFav = FAVORITES.indexOf(a.base);
      const bFav = FAVORITES.indexOf(b.base);
      if (aFav !== -1 && bFav !== -1) return aFav - bFav;
      if (aFav !== -1) return -1;
      if (bFav !== -1) return 1;
      return a.base.localeCompare(b.base);
    });

  _pairsCache = pairs;
  return pairs;
}
