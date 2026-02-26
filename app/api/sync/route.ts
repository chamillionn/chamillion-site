import { NextResponse } from "next/server";
import { authCheck, type SyncResult } from "@/lib/sync/types";
import { captureSnapshot } from "@/lib/sync/snapshot";

const SYNC_ROUTES = ["hyperliquid", "polymarket"];

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: SyncResult[] = [];
  const baseUrl = new URL(request.url).origin;
  const auth = request.headers.get("authorization") ?? "";

  for (const route of SYNC_ROUTES) {
    try {
      const res = await fetch(`${baseUrl}/api/sync/${route}`, {
        headers: { Authorization: auth },
      });
      const data = await res.json();
      results.push(data as SyncResult);
    } catch (e) {
      results.push({
        platform: route,
        updated: 0,
        errors: [e instanceof Error ? e.message : String(e)],
        timestamp: new Date().toISOString(),
      });
    }
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
