import type { PlatformAdapter, PositionRow } from "../types";
import { assertOk } from "../validate";

const POLY_API = "https://data-api.polymarket.com/positions";

interface PolyPosition {
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  curPrice: number;
  conditionId: string;
  slug: string;
}

export const PolymarketAdapter: PlatformAdapter = {
  platformName: "Polymarket",

  async fetchPositions(wallet: string) {
    const positions: PositionRow[] = [];
    const warnings: string[] = [];

    const url = `${POLY_API}?user=${wallet}&sizeThreshold=0&limit=500`;
    const res = await fetch(url);
    assertOk(res, "Polymarket positions");
    const raw = await res.json();

    if (!Array.isArray(raw)) {
      throw new Error(`Polymarket: expected array, got ${typeof raw}`);
    }

    for (const p of raw as PolyPosition[]) {
      if (!p.size || p.size === 0) continue;

      const shortTitle = p.title?.length > 60
        ? p.title.slice(0, 57) + "..."
        : (p.title ?? "Unknown");

      positions.push({
        asset: `${shortTitle} (${p.outcome})`,
        size: p.size,
        cost_basis: p.initialValue ?? 0,
        current_value: p.currentValue ?? 0,
        notes: `${p.outcome} @ ${((p.curPrice ?? 0) * 100).toFixed(0)}¢ | Avg: ${((p.avgPrice ?? 0) * 100).toFixed(0)}¢ | PnL: $${(p.cashPnl ?? 0).toFixed(2)} (${(p.percentPnl ?? 0).toFixed(1)}%)`,
      });
    }

    return { positions, warnings };
  },
};
