import type { HomeProps } from "@/app/(home)/home-client";

/**
 * Demo portfolio data shown on the public homepage when demo_mode is enabled.
 * All values hardcoded (no Math.random) to avoid SSR hydration mismatches.
 */

const COLORS = ["#5BAA7C", "#6B8EA0", "#C9A84C", "#8B6BBF"];

const dailyData = [
  { day: "lun", total: 8210 }, { day: "mar", total: 8340 },
  { day: "mié", total: 8285 }, { day: "jue", total: 8420 },
  { day: "vie", total: 8510 }, { day: "sáb", total: 8475 },
  { day: "dom", total: 8620 }, { day: "lun", total: 8590 },
  { day: "mar", total: 8750 }, { day: "mié", total: 8680 },
  { day: "jue", total: 8820 }, { day: "vie", total: 8910 },
  { day: "sáb", total: 8870 }, { day: "dom", total: 9020 },
  { day: "lun", total: 9150 }, { day: "mar", total: 9080 },
  { day: "mié", total: 9210 }, { day: "jue", total: 9340 },
  { day: "vie", total: 9280 }, { day: "sáb", total: 9420 },
  { day: "dom", total: 9510 }, { day: "lun", total: 9580 },
  { day: "mar", total: 9650 }, { day: "mié", total: 9720 },
  { day: "jue", total: 9810 }, { day: "vie", total: 9950 },
  { day: "sáb", total: 10080 }, { day: "dom", total: 10150 },
  { day: "lun", total: 10320 }, { day: "mar", total: 10450 },
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
