import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveEurUsdRate } from "@/lib/sync/forex";
import { HyperliquidTradeFetcher } from "@/lib/sync/trades/hyperliquid";
import { PolymarketTradeFetcher } from "@/lib/sync/trades/polymarket";
import { OnchainTradeFetcher } from "@/lib/sync/trades/onchain";
import type { TradeFetcher, TradeRow } from "@/lib/sync/trades/types";

const FETCHERS: TradeFetcher[] = [
  HyperliquidTradeFetcher,
  PolymarketTradeFetcher,
  OnchainTradeFetcher,
];

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { rate: eurUsdRate, source: rateSource } = await resolveEurUsdRate(supabase);

  const results = [];

  for (const fetcher of FETCHERS) {
    const platformResult = {
      platform: fetcher.platformName,
      inserted: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // 1. Look up platform row + wallet
    const { data: platforms } = await supabase
      .from("platforms")
      .select("id, wallet_address")
      .eq("name", fetcher.platformName)
      .limit(1);

    const platform = (platforms as { id: string; wallet_address: string | null }[] | null)?.[0];
    if (!platform?.wallet_address) {
      platformResult.errors.push(`${fetcher.platformName}: no wallet address configured`);
      results.push(platformResult);
      continue;
    }

    // 2. Get the most recent trade timestamp for this platform (for incremental sync)
    const { data: lastTrade } = await supabase
      .from("trades")
      .select("executed_at")
      .eq("platform_id", platform.id)
      .order("executed_at", { ascending: false })
      .limit(1);

    const since = (lastTrade as { executed_at: string }[] | null)?.[0]?.executed_at
      ? new Date((lastTrade as { executed_at: string }[])[0].executed_at)
      : null;

    // 3. Fetch trades from platform API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    let trades: TradeRow[];
    try {
      const result = await fetcher.fetchTrades(
        platform.wallet_address,
        platform.id,
        since,
        eurUsdRate,
        controller.signal,
      );
      trades = result.trades;
      platformResult.errors.push(...result.warnings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      platformResult.errors.push(
        controller.signal.aborted
          ? `Timeout (60s): ${fetcher.platformName}`
          : `Fetch: ${msg}`,
      );
      results.push(platformResult);
      clearTimeout(timeoutId);
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (trades.length === 0) {
      results.push(platformResult);
      continue;
    }

    // 4. Batch insert with dedup (ON CONFLICT DO NOTHING)
    const BATCH_SIZE = 200;
    for (let i = 0; i < trades.length; i += BATCH_SIZE) {
      const batch = trades.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from("trades")
        .upsert(batch, { onConflict: "platform_id,trade_id", ignoreDuplicates: true })
        .select("id");

      if (error) {
        platformResult.errors.push(`Insert batch ${i}: ${error.message}`);
      } else {
        platformResult.inserted += data?.length ?? 0;
        platformResult.skipped += batch.length - (data?.length ?? 0);
      }
    }

    results.push(platformResult);
  }

  return NextResponse.json({
    results,
    eurUsdRate: { rate: eurUsdRate, source: rateSource },
    totalInserted: results.reduce((s, r) => s + r.inserted, 0),
    totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
    timestamp: new Date().toISOString(),
  });
}
