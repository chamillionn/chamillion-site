import type { Timeframe } from "./binance";

export type AssetSource = "binance" | "twelvedata";
export type AssetCategory = "crypto" | "stock" | "index" | "forex" | "commodity";
export type AssetTier = "free" | "premium";

export interface AssetMeta {
  /** Stable internal id (also used as URL/DB slug) */
  id: string;
  /** Provider-specific ticker */
  symbol: string;
  /** Which provider backs this asset */
  source: AssetSource;
  /** Short display label (e.g. "Bitcoin") */
  label: string;
  /** Secondary label shown in dropdown (e.g. "BTCUSDT") */
  sublabel?: string;
  category: AssetCategory;
  tier: AssetTier;
  /** Timeframes supported for this asset. Twelve Data supports all three. */
  timeframes: Timeframe[];
}

const ALL_TFS: Timeframe[] = ["1h", "4h", "1d"];

/* ── Free tier (anon-accessible) ── */

export const FREE_ASSETS: AssetMeta[] = [
  { id: "btc",    symbol: "BTCUSDT", source: "binance",    label: "Bitcoin",  sublabel: "BTC/USDT",       category: "crypto",    tier: "free", timeframes: ALL_TFS },
  { id: "eth",    symbol: "ETHUSDT", source: "binance",    label: "Ethereum", sublabel: "ETH/USDT",       category: "crypto",    tier: "free", timeframes: ALL_TFS },
  { id: "gold",   symbol: "XAU/USD", source: "twelvedata", label: "Oro",      sublabel: "XAU/USD",        category: "commodity", tier: "free", timeframes: ALL_TFS },
  { id: "aapl",   symbol: "AAPL",    source: "twelvedata", label: "Apple",    sublabel: "AAPL",           category: "stock",     tier: "free", timeframes: ALL_TFS },
  { id: "googl",  symbol: "GOOGL",   source: "twelvedata", label: "Google",   sublabel: "GOOGL",          category: "stock",     tier: "free", timeframes: ALL_TFS },
  { id: "nvda",   symbol: "NVDA",    source: "twelvedata", label: "NVIDIA",   sublabel: "NVDA",           category: "stock",     tier: "free", timeframes: ALL_TFS },
  { id: "sp500",  symbol: "SPX",     source: "twelvedata", label: "S&P 500",  sublabel: "SPX",            category: "index",     tier: "free", timeframes: ALL_TFS },
  { id: "eurusd", symbol: "EUR/USD", source: "twelvedata", label: "EUR/USD",  sublabel: "EUR/USD",        category: "forex",     tier: "free", timeframes: ALL_TFS },
  { id: "usdjpy", symbol: "USD/JPY", source: "twelvedata", label: "USD/JPY",  sublabel: "USD/JPY",        category: "forex",     tier: "free", timeframes: ALL_TFS },
];

/* ── Premium Twelve Data catalog ── */

export const PREMIUM_EXTRAS: AssetMeta[] = [
  // Stocks
  { id: "msft",   symbol: "MSFT",   source: "twelvedata", label: "Microsoft", sublabel: "MSFT", category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "tsla",   symbol: "TSLA",   source: "twelvedata", label: "Tesla",     sublabel: "TSLA", category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "meta",   symbol: "META",   source: "twelvedata", label: "Meta",      sublabel: "META", category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "amzn",   symbol: "AMZN",   source: "twelvedata", label: "Amazon",    sublabel: "AMZN", category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "amd",    symbol: "AMD",    source: "twelvedata", label: "AMD",       sublabel: "AMD",  category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "jpm",    symbol: "JPM",    source: "twelvedata", label: "JPMorgan",  sublabel: "JPM",  category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "v",      symbol: "V",      source: "twelvedata", label: "Visa",      sublabel: "V",    category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "wmt",    symbol: "WMT",    source: "twelvedata", label: "Walmart",   sublabel: "WMT",  category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "xom",    symbol: "XOM",    source: "twelvedata", label: "Exxon",     sublabel: "XOM",  category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "asml",   symbol: "ASML",   source: "twelvedata", label: "ASML",      sublabel: "ASML", category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "pltr",   symbol: "PLTR",   source: "twelvedata", label: "Palantir",  sublabel: "PLTR", category: "stock", tier: "premium", timeframes: ALL_TFS },
  { id: "coin",   symbol: "COIN",   source: "twelvedata", label: "Coinbase",  sublabel: "COIN", category: "stock", tier: "premium", timeframes: ALL_TFS },

  // Indices
  { id: "nasdaq", symbol: "IXIC",  source: "twelvedata", label: "Nasdaq",     sublabel: "IXIC",  category: "index", tier: "premium", timeframes: ALL_TFS },
  { id: "dow",    symbol: "DJI",   source: "twelvedata", label: "Dow Jones",  sublabel: "DJI",   category: "index", tier: "premium", timeframes: ALL_TFS },
  { id: "ibex",   symbol: "IBEX",  source: "twelvedata", label: "IBEX 35",    sublabel: "IBEX",  category: "index", tier: "premium", timeframes: ALL_TFS },
  { id: "dax",    symbol: "DAX",   source: "twelvedata", label: "DAX",        sublabel: "DAX",   category: "index", tier: "premium", timeframes: ALL_TFS },
  { id: "ftse",   symbol: "UKX",   source: "twelvedata", label: "FTSE 100",   sublabel: "UKX",   category: "index", tier: "premium", timeframes: ALL_TFS },
  { id: "nikkei", symbol: "N225",  source: "twelvedata", label: "Nikkei 225", sublabel: "N225",  category: "index", tier: "premium", timeframes: ALL_TFS },

  // Forex
  { id: "gbpusd", symbol: "GBP/USD", source: "twelvedata", label: "GBP/USD", sublabel: "GBP/USD", category: "forex", tier: "premium", timeframes: ALL_TFS },
  { id: "audusd", symbol: "AUD/USD", source: "twelvedata", label: "AUD/USD", sublabel: "AUD/USD", category: "forex", tier: "premium", timeframes: ALL_TFS },
  { id: "usdchf", symbol: "USD/CHF", source: "twelvedata", label: "USD/CHF", sublabel: "USD/CHF", category: "forex", tier: "premium", timeframes: ALL_TFS },
  { id: "usdcad", symbol: "USD/CAD", source: "twelvedata", label: "USD/CAD", sublabel: "USD/CAD", category: "forex", tier: "premium", timeframes: ALL_TFS },
  { id: "usdmxn", symbol: "USD/MXN", source: "twelvedata", label: "USD/MXN", sublabel: "USD/MXN", category: "forex", tier: "premium", timeframes: ALL_TFS },

  // Commodities
  { id: "silver", symbol: "XAG/USD", source: "twelvedata", label: "Plata",     sublabel: "XAG/USD", category: "commodity", tier: "premium", timeframes: ALL_TFS },
  { id: "copper", symbol: "HG1",     source: "twelvedata", label: "Cobre",     sublabel: "HG1",     category: "commodity", tier: "premium", timeframes: ALL_TFS },
  { id: "wti",    symbol: "WTI",     source: "twelvedata", label: "Crudo WTI", sublabel: "WTI",     category: "commodity", tier: "premium", timeframes: ALL_TFS },
  { id: "brent",  symbol: "BRENT",   source: "twelvedata", label: "Brent",     sublabel: "BRENT",   category: "commodity", tier: "premium", timeframes: ALL_TFS },
];

/** Crypto quick-picks we want to surface as "recommended" in premium.
 *  The remaining ~440 USDT pairs still appear in search. */
export const PREMIUM_CRYPTO_FAVORITES = [
  "SOL", "XRP", "ADA", "AVAX", "DOT", "LINK", "DOGE", "SUI",
  "ARB", "OP", "BNB", "TON", "ATOM", "NEAR", "APT", "LTC",
];

/** The full curated catalog (without the dynamic Binance extras). */
export const CATALOG: AssetMeta[] = [...FREE_ASSETS, ...PREMIUM_EXTRAS];

export function findAsset(idOrSymbol: string): AssetMeta | undefined {
  return CATALOG.find(
    (a) => a.id === idOrSymbol || a.symbol === idOrSymbol,
  );
}

export function categoryLabel(c: AssetCategory): string {
  switch (c) {
    case "crypto":    return "Crypto";
    case "stock":     return "Acciones";
    case "index":     return "Índices";
    case "forex":     return "Forex";
    case "commodity": return "Commodities";
  }
}
