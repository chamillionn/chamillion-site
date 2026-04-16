import type { TradeFetcher, TradeRow } from "./types";
import type { TradeSide } from "@/lib/supabase/types";
import { assertOk } from "../validate";
import { usdToEur } from "../forex";

const POLY_ACTIVITY_API = "https://data-api.polymarket.com/activity";

/**
 * Polymarket activity record.
 * Endpoint: GET /activity?user=<wallet>&limit=500&offset=0
 */
interface PolyActivity {
  id: string;
  type: string;         // "TRADE" | "REDEEM" | etc.
  title: string;        // market title
  outcome: string;      // "Yes" | "No"
  side: string;         // "BUY" | "SELL"
  size: number;         // number of shares
  price: number;        // price per share (0-1)
  usdcSize: number;     // total USDC spent/received
  fee: number;
  timestamp: number;     // unix seconds
  conditionId: string;
  slug: string;
  transactionHash: string;
}

function polySideToTradeSide(side: string): TradeSide {
  return side.toUpperCase() === "BUY" ? "buy" : "sell";
}

export const PolymarketTradeFetcher: TradeFetcher = {
  platformName: "Polymarket",

  async fetchTrades(wallet, platformId, since, eurUsdRate, signal) {
    const trades: TradeRow[] = [];
    const warnings: string[] = [];

    const sinceMs = since ? since.getTime() : 0;
    let offset = 0;
    const limit = 500;

    while (true) {
      const url = `${POLY_ACTIVITY_API}?user=${wallet}&limit=${limit}&offset=${offset}`;
      const res = await fetch(url, { signal });
      assertOk(res, "Polymarket activity");

      const raw = await res.json();
      if (!Array.isArray(raw) || raw.length === 0) break;

      let reachedOldData = false;

      for (const a of raw as PolyActivity[]) {
        // Only process actual trades
        if (a.type !== "TRADE") continue;

        // Polymarket returns unix seconds, not milliseconds
        const executedAt = new Date(
          typeof a.timestamp === "number" ? a.timestamp * 1000 : a.timestamp
        );
        if (executedAt.getTime() <= sinceMs) {
          reachedOldData = true;
          break;
        }

        if (!a.size || a.size === 0) continue;

        const shortTitle = a.title?.length > 50
          ? a.title.slice(0, 47) + "..."
          : (a.title ?? "Unknown");

        const totalValue = a.usdcSize ?? a.size * a.price;

        trades.push({
          platform_id: platformId,
          asset: `${shortTitle} (${a.outcome})`,
          side: polySideToTradeSide(a.side),
          quantity: a.size,
          price: a.price,
          total_value: totalValue,
          total_value_eur: usdToEur(totalValue, eurUsdRate),
          fee: a.fee ?? null,
          trade_id: a.id || a.transactionHash,
          executed_at: executedAt.toISOString(),
        });
      }

      if (reachedOldData) break;

      // If we got fewer than limit, no more pages
      if (raw.length < limit) break;
      offset += limit;
    }

    return { trades, warnings };
  },
};
