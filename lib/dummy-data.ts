import type { HomeProps } from "@/app/(home)/home-client";

/**
 * Demo portfolio data shown on the public homepage when demo_mode is enabled.
 * All values hardcoded (no Math.random) to avoid SSR hydration mismatches.
 */

const COLORS = ["#5BAA7C", "#6B8EA0", "#C9A84C", "#8B6BBF"];

const dailyData = [
  { date: "2026-02-26", day: "lun", total: 8210 }, { date: "2026-02-27", day: "mar", total: 8340 },
  { date: "2026-02-28", day: "mié", total: 8285 }, { date: "2026-03-01", day: "jue", total: 8420 },
  { date: "2026-03-02", day: "vie", total: 8510 }, { date: "2026-03-03", day: "sáb", total: 8475 },
  { date: "2026-03-04", day: "dom", total: 8620 }, { date: "2026-03-05", day: "lun", total: 8590 },
  { date: "2026-03-06", day: "mar", total: 8750 }, { date: "2026-03-07", day: "mié", total: 8680 },
  { date: "2026-03-08", day: "jue", total: 8820 }, { date: "2026-03-09", day: "vie", total: 8910 },
  { date: "2026-03-10", day: "sáb", total: 8870 }, { date: "2026-03-11", day: "dom", total: 9020 },
  { date: "2026-03-12", day: "lun", total: 9150 }, { date: "2026-03-13", day: "mar", total: 9080 },
  { date: "2026-03-14", day: "mié", total: 9210 }, { date: "2026-03-15", day: "jue", total: 9340 },
  { date: "2026-03-16", day: "vie", total: 9280 }, { date: "2026-03-17", day: "sáb", total: 9420 },
  { date: "2026-03-18", day: "dom", total: 9510 }, { date: "2026-03-19", day: "lun", total: 9580 },
  { date: "2026-03-20", day: "mar", total: 9650 }, { date: "2026-03-21", day: "mié", total: 9720 },
  { date: "2026-03-22", day: "jue", total: 9810 }, { date: "2026-03-23", day: "vie", total: 9950 },
  { date: "2026-03-24", day: "sáb", total: 10080 }, { date: "2026-03-25", day: "dom", total: 10150 },
  { date: "2026-03-26", day: "lun", total: 10320 }, { date: "2026-03-27", day: "mar", total: 10450 },
];

export const DEMO_DATA: HomeProps = {
  summary: {
    totalValue: 10450,
    totalCost: 8500,
    totalPnl: 1950,
    totalRoiPct: 22.94,
  },
  platforms: [
    {
      name: "Hyperliquid",
      chain: "Perps",
      value: 3970,
      color: COLORS[0],
      walletAddress: "0x1a2b...9f0e",
      positions: [
        { name: "ETH-PERP", value: 2300, pnl: 340, pnlPercent: "18.50" },
        { name: "BTC-PERP", value: 1670, pnl: -85, pnlPercent: "-4.80" },
      ],
    },
    {
      name: "Aave",
      chain: "Lending",
      value: 2930,
      color: COLORS[1],
      walletAddress: "0x3c4d...7a1b",
      positions: [
        { name: "USDC Supply", value: 1880, pnl: 120, pnlPercent: "6.40" },
        { name: "WETH Supply", value: 1050, pnl: 210, pnlPercent: "22.10" },
      ],
    },
    {
      name: "Polymarket",
      chain: "Prediction",
      value: 2090,
      color: COLORS[2],
      walletAddress: "0x5e6f...2c3d",
      positions: [
        { name: "Fed rate cut Jun", value: 1250, pnl: 95, pnlPercent: "8.20" },
        { name: "ETH > 5k Jul", value: 840, pnl: -40, pnlPercent: "-5.10" },
      ],
    },
    {
      name: "Uniswap",
      chain: "DEX",
      value: 1460,
      color: COLORS[3],
      walletAddress: "0x7a8b...4e5f",
      positions: [
        { name: "ETH/USDC LP", value: 1460, pnl: 180, pnlPercent: "14.30" },
      ],
    },
  ],
  totalValue: 10450,
  dailyData,
  capitalInvested: 8500,
};
