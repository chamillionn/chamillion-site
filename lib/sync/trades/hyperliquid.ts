import type { TradeFetcher, TradeRow } from "./types";
import type { TradeSide } from "@/lib/supabase/types";
import { safeFloat, assertOk } from "../validate";
import { usdToEur } from "../forex";

const HL_API = "https://api.hyperliquid.xyz/info";

/**
 * Hyperliquid fill record from `userFillsByTime`.
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
 */
interface HLFill {
  coin: string;
  px: string;       // execution price
  sz: string;       // size (always positive)
  side: "B" | "A";  // B = buy, A = sell
  time: number;     // unix ms
  startPosition: string;
  dir: string;      // e.g. "Open Long", "Close Short", "Buy", "Sell"
  closedPnl: string;
  hash: string;     // tx hash
  oid: number;      // order id
  crossed: boolean;
  fee: string;
  tid: number;      // trade/fill id — unique per fill
  feeToken: string;
}

function dirToSide(dir: string, side: "B" | "A"): TradeSide {
  const d = dir.toLowerCase();
  if (d.includes("open long")) return "open_long";
  if (d.includes("open short")) return "open_short";
  if (d.includes("close long")) return "close_long";
  if (d.includes("close short")) return "close_short";
  return side === "B" ? "buy" : "sell";
}

export const HyperliquidTradeFetcher: TradeFetcher = {
  platformName: "Hyperliquid",

  async fetchTrades(wallet, platformId, since, eurUsdRate, signal) {
    const trades: TradeRow[] = [];
    const warnings: string[] = [];

    // Paginate from `since` (or 0 for full history) up to now.
    // HL returns max 2000 fills per request, ordered ascending.
    const startTime = since ? since.getTime() : 0;
    let cursor = startTime;
    const now = Date.now();

    while (cursor < now) {
      const res = await fetch(HL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "userFillsByTime",
          user: wallet,
          startTime: cursor,
          endTime: now,
        }),
        signal,
      });
      assertOk(res, "Hyperliquid fills");

      const fills: HLFill[] = await res.json();
      if (!Array.isArray(fills) || fills.length === 0) break;

      for (const f of fills) {
        const px = safeFloat(f.px);
        const sz = safeFloat(f.sz);
        const fee = safeFloat(f.fee);

        if (px == null || sz == null || sz === 0) {
          warnings.push(`HL fill tid=${f.tid}: invalid px/sz, skipped`);
          continue;
        }

        const totalValue = px * sz;

        trades.push({
          platform_id: platformId,
          asset: f.coin,
          side: dirToSide(f.dir, f.side),
          quantity: sz,
          price: px,
          total_value: totalValue,
          total_value_eur: usdToEur(totalValue, eurUsdRate),
          fee: fee != null ? fee : null,
          trade_id: String(f.tid),
          executed_at: new Date(f.time).toISOString(),
        });
      }

      // Move cursor past the last fill's timestamp to fetch the next page.
      // Add 1ms to avoid re-fetching the last fill.
      const lastTime = fills[fills.length - 1].time;
      if (lastTime <= cursor) break; // safety: avoid infinite loop
      cursor = lastTime + 1;

      // HL returns up to 2000 per request. If fewer, we've reached the end.
      if (fills.length < 2000) break;
    }

    return { trades, warnings };
  },
};
