import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { syncPlatform } from "@/lib/sync/engine";
import { captureSnapshot } from "@/lib/sync/snapshot";
import { HyperliquidAdapter } from "@/lib/sync/adapters/hyperliquid";
import { PolymarketAdapter } from "@/lib/sync/adapters/polymarket";

const ADAPTERS = [HyperliquidAdapter, PolymarketAdapter];

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];
  for (const adapter of ADAPTERS) {
    const result = await syncPlatform(adapter);
    results.push(result);
  }

  // Capture portfolio snapshot after all positions are fresh
  const snapshot = await captureSnapshot().catch((e) => ({
    captured: false,
    snapshot_date: new Date().toISOString(),
    total_value: 0,
    positions_count: 0,
    error: e instanceof Error ? e.message : String(e),
  }));

  return NextResponse.json({
    results,
    snapshot,
    totalUpdated: results.reduce((s, r) => s + r.updated, 0),
    totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
    timestamp: new Date().toISOString(),
  });
}
