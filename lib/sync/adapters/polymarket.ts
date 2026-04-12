import type { PlatformAdapter, PositionRow } from "../types";
import { assertOk } from "../validate";

const POLY_API = "https://data-api.polymarket.com/positions";

// USDC contracts on Polygon (both 6 decimals)
const POLYGON_RPCS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
];
const USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC.e
const USDC_NATIVE  = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // native USDC
const BALANCE_OF = "0x70a08231"; // balanceOf(address)

async function queryErc20Balance(token: string, wallet: string, signal?: AbortSignal): Promise<number> {
  const paddedAddr = wallet.slice(2).toLowerCase().padStart(64, "0");
  const body = JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "eth_call",
    params: [{ to: token, data: `${BALANCE_OF}${paddedAddr}` }, "latest"],
  });

  for (const rpc of POLYGON_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal,
      });
      const text = await res.text();
      if (text.startsWith("<")) continue; // HTML error page — try next RPC
      const json = JSON.parse(text);
      if (!json.result || json.result === "0x") return 0;
      return parseInt(json.result, 16) / 1e6;
    } catch {
      continue; // try next RPC
    }
  }
  return 0; // all RPCs failed — treat as zero
}

async function fetchUsdcBalance(wallet: string, signal?: AbortSignal): Promise<number> {
  const [bridged, native] = await Promise.all([
    queryErc20Balance(USDC_BRIDGED, wallet, signal),
    queryErc20Balance(USDC_NATIVE, wallet, signal),
  ]);
  return bridged + native;
}

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

  async fetchPositions(wallet: string, signal?: AbortSignal) {
    const positions: PositionRow[] = [];
    const warnings: string[] = [];

    const url = `${POLY_API}?user=${wallet}&sizeThreshold=0&limit=500`;
    const res = await fetch(url, { signal });
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

    // Fetch idle USDC balance on Polygon
    try {
      const usdcBalance = await fetchUsdcBalance(wallet, signal);
      if (usdcBalance >= 0.01) {
        positions.push({
          asset: "USDC (Cash)",
          size: usdcBalance,
          cost_basis: usdcBalance,
          current_value: usdcBalance,
          notes: "Idle USDC balance on Polymarket",
        });
      }
    } catch {
      warnings.push("Could not fetch USDC balance from Polygon RPC");
    }

    return { positions, warnings };
  },
};
