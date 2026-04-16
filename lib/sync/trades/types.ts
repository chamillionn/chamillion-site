import type { TradeSide } from "@/lib/supabase/types";

/** Normalized trade row ready for DB insert. */
export interface TradeRow {
  platform_id: string;
  asset: string;
  side: TradeSide;
  quantity: number;
  price: number;
  total_value: number;
  total_value_eur: number | null;
  fee: number | null;
  trade_id: string;
  executed_at: string; // ISO timestamp
}

export interface TradeFetchResult {
  trades: TradeRow[];
  warnings: string[];
}

/** Each platform implements its own trade history fetcher. */
export interface TradeFetcher {
  platformName: string;
  fetchTrades(
    wallet: string,
    platformId: string,
    since: Date | null,
    eurUsdRate: number,
    signal?: AbortSignal,
  ): Promise<TradeFetchResult>;
}
