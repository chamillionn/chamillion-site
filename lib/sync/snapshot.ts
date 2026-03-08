import { createServiceClient } from "@/lib/supabase/server";
import type { PositionEnriched, PortfolioSummary } from "@/lib/supabase/types";

export interface SnapshotResult {
  captured: boolean;
  snapshot_date: string;
  total_value: number;
  positions_count: number;
  error?: string;
}

/**
 * Round a Date to the nearest 15-minute slot (floor).
 * e.g. 14:07 → 14:00, 14:16 → 14:15, 14:44 → 14:30
 */
function roundTo15Min(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
  return d;
}

/**
 * Capture a portfolio snapshot.
 * Reads from portfolio_summary + positions_enriched views (already fresh after sync),
 * then inserts into snapshots table with a 15-min-rounded timestamp.
 * If a snapshot already exists for this slot, it's skipped (ignoreDuplicates).
 */
export async function captureSnapshot(eurUsdRate?: number): Promise<SnapshotResult> {
  const slotDate = roundTo15Min(new Date());
  const slotISO = slotDate.toISOString();

  const supabase = createServiceClient();

  // 1. Read current portfolio summary
  const { data: summary, error: summaryErr } = await supabase
    .from("portfolio_summary")
    .select("*")
    .single();

  if (summaryErr || !summary) {
    return {
      captured: false,
      snapshot_date: slotISO,
      total_value: 0,
      positions_count: 0,
      error: summaryErr?.message ?? "No portfolio summary available",
    };
  }

  const s = summary as PortfolioSummary;

  // Skip snapshot if no positions exist yet
  if (s.total_positions === 0 || s.total_value == null) {
    return {
      captured: false,
      snapshot_date: slotISO,
      total_value: 0,
      positions_count: 0,
      error: "No positions to snapshot",
    };
  }

  // 2. Read current positions for historical breakdown
  const { data: positions } = await supabase
    .from("positions_enriched")
    .select("*")
    .order("allocation_pct", { ascending: false });

  const positionsData = ((positions as PositionEnriched[]) ?? []).map((p) => ({
    id: p.id,
    asset: p.asset,
    platform: p.platform_name,
    strategy: p.strategy_name,
    size: p.size,
    cost_basis: p.cost_basis,
    current_value: p.current_value,
    pnl: p.pnl ?? 0,
    roi_pct: p.roi_pct ?? 0,
    allocation_pct: p.allocation_pct ?? 0,
  }));

  // 3. Insert snapshot for this 15-min slot (skip if already exists)
  const { error: insertErr } = await supabase.from("snapshots").upsert(
    {
      snapshot_date: slotISO,
      total_value: s.total_value ?? 0,
      total_cost: s.total_cost ?? 0,
      eurusd_rate: eurUsdRate ?? null,
      positions_data: positionsData,
      notes: `Auto: ${s.total_positions ?? 0} pos, ${(s.total_value ?? 0).toFixed(2)}€`,
    },
    { onConflict: "snapshot_date", ignoreDuplicates: true },
  );

  if (insertErr) {
    return {
      captured: false,
      snapshot_date: slotISO,
      total_value: s.total_value,
      positions_count: positionsData.length,
      error: insertErr.message,
    };
  }

  return {
    captured: true,
    snapshot_date: slotISO,
    total_value: s.total_value,
    positions_count: positionsData.length,
  };
}
