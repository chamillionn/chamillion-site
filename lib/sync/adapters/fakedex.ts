import type { PlatformAdapter, PositionRow } from "../types";

const FAKE_ASSETS = [
  "FKT Perp", "MOCK Spot", "SIM/USDC LP", "TEST Perp",
  "DEGEN Spot", "SHAM Perp", "FAUX/ETH LP", "BOGUS Spot",
  "PSEUDO Perp", "PHONY Spot",
];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * FakeDEX: generates random positions for dev testing.
 * The wallet address is ignored — positions are purely random.
 * Each sync produces 3-7 positions with random values.
 */
export const FakeDexAdapter: PlatformAdapter = {
  platformName: "FakeDEX",

  async fetchPositions() {
    const count = 3 + Math.floor(Math.random() * 5); // 3-7 positions
    const picked = [...FAKE_ASSETS].sort(() => Math.random() - 0.5).slice(0, count);

    const positions: PositionRow[] = picked.map((asset) => {
      const cost = rand(20, 500);
      const pnlPct = rand(-40, 80);
      const value = Math.round(cost * (1 + pnlPct / 100) * 100) / 100;
      const size = rand(0.1, 50);
      const pnl = Math.round((value - cost) * 100) / 100;

      return {
        asset,
        size,
        cost_basis: cost,
        current_value: value,
        notes: `Fake | PnL: $${pnl.toFixed(2)} (${pnlPct.toFixed(1)}%)`,
      };
    });

    return { positions, warnings: [] };
  },
};
