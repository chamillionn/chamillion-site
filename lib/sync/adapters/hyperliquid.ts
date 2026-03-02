import type { PlatformAdapter, PositionRow } from "../types";
import { safeFloat, assertOk } from "../validate";

const HL_API = "https://api.hyperliquid.xyz/info";

interface HLPosition {
  type: string;
  position: {
    coin: string;
    szi: string;
    entryPx: string;
    positionValue: string;
    unrealizedPnl: string;
    marginUsed: string;
  };
}

interface HLSpotBalance {
  coin: string;
  total: string;
  hold: string;
  entryNtl: string;
}

export const HyperliquidAdapter: PlatformAdapter = {
  platformName: "Hyperliquid",

  async fetchPositions(wallet: string, signal?: AbortSignal) {
    const positions: PositionRow[] = [];
    const warnings: string[] = [];

    // --- Perps ---
    const perpRes = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: wallet }),
      signal,
    });
    assertOk(perpRes, "Hyperliquid perps");
    const perpData = await perpRes.json();

    if (perpData?.assetPositions) {
      for (const ap of perpData.assetPositions as HLPosition[]) {
        const p = ap.position;
        const size = safeFloat(p.szi);
        if (size == null || size === 0) continue;

        const positionValue = safeFloat(p.positionValue);
        const entryPx = safeFloat(p.entryPx);
        const marginUsed = safeFloat(p.marginUsed);
        const unrealizedPnl = safeFloat(p.unrealizedPnl);

        if (positionValue == null || entryPx == null) {
          warnings.push(`Perp ${p.coin}: invalid numeric values, skipped`);
          continue;
        }

        positions.push({
          asset: `${p.coin} Perp`,
          size: Math.abs(size),
          cost_basis: Math.abs(size) * entryPx,
          current_value: positionValue,
          notes: `${size > 0 ? "Long" : "Short"} | Margin: $${(marginUsed ?? 0).toFixed(2)} | uPnL: $${(unrealizedPnl ?? 0).toFixed(2)}`,
        });
      }
    }

    // --- Spot ---
    const spotRes = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "spotClearinghouseState", user: wallet }),
      signal,
    });
    assertOk(spotRes, "Hyperliquid spot");
    const spotData = await spotRes.json();

    if (spotData?.balances) {
      for (const b of spotData.balances as HLSpotBalance[]) {
        const total = safeFloat(b.total);
        if (total == null || total === 0) continue;
        if (b.coin === "USDC") continue;

        const entryNtl = safeFloat(b.entryNtl) ?? 0;

        positions.push({
          asset: `${b.coin} Spot`,
          size: total,
          cost_basis: entryNtl,
          current_value: entryNtl, // Known limitation: HL spot API doesn't return live market value
          notes: `Spot balance | Hold: ${b.hold}`,
        });
      }
    }

    return { positions, warnings };
  },
};
