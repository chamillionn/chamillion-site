import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { syncPlatform } from "@/lib/sync/engine";
import { captureSnapshot } from "@/lib/sync/snapshot";
import { resolveEurUsdRate } from "@/lib/sync/forex";
import { createServiceClient } from "@/lib/supabase/server";
import { HyperliquidAdapter } from "@/lib/sync/adapters/hyperliquid";
import { PolymarketAdapter } from "@/lib/sync/adapters/polymarket";
import { DefiWalletAdapter } from "@/lib/sync/adapters/defi-wallet";
import { FakeDexAdapter } from "@/lib/sync/adapters/fakedex";
import type { PlatformAdapter } from "@/lib/sync/types";

const IS_DEV = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("hpyyuftotmpnzogaykgh");

const ADAPTERS: PlatformAdapter[] = [
  HyperliquidAdapter,
  PolymarketAdapter,
  DefiWalletAdapter,
  ...(IS_DEV ? [FakeDexAdapter] : []),
];

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch EUR/USD rate once for all adapters
  const supabase = createServiceClient();
  const { rate: eurUsdRate, source: rateSource } = await resolveEurUsdRate(supabase);

  const results = [];
  for (const adapter of ADAPTERS) {
    const result = await syncPlatform(adapter, eurUsdRate);
    results.push(result);
  }

  // Capture portfolio snapshot after all positions are fresh
  const snapshot = await captureSnapshot(eurUsdRate).catch((e) => ({
    captured: false,
    snapshot_date: new Date().toISOString(),
    total_value: 0,
    positions_count: 0,
    error: e instanceof Error ? e.message : String(e),
  }));

  return NextResponse.json({
    results,
    snapshot,
    eurUsdRate: { rate: eurUsdRate, source: rateSource },
    totalUpdated: results.reduce((s, r) => s + r.updated, 0),
    totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
    timestamp: new Date().toISOString(),
  });
}
