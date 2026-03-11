import type { Metadata } from "next";
import {
  getPortfolioSummary,
  getPositions,
  getPlatforms,
  getDailySnapshots,
  getCostBasis,
  isDemoMode,
  resolvePublicClient,
} from "@/lib/supabase/queries";
import { KNOWN_PLATFORMS } from "@/lib/platforms/presets";
import VerifyClient from "./verify-client";
import type { VerifyPlatform } from "./verify-client";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Portfolio en Vivo | Chamillion",
  description:
    "Sigue el portfolio real de Chamillion en tiempo real. Rendimiento verificado on-chain.",
  openGraph: {
    title: "Portfolio en vivo | Chamillion",
    description:
      "Resultados reales, verificados on-chain. Sigue la cartera de Chamillion.",
  },
};

const PLATFORM_COLORS = [
  "#5BAA7C", "#6B8EA0", "#C9A84C", "#8B6BBF",
  "#C7555A", "#E08A5E", "#5B9BD5", "#8BC34A",
];

const PLATFORM_COLORS_LIGHT = [
  "#358a55", "#3a6d88", "#8a7020", "#6040a0",
  "#a8333a", "#b05a30", "#2e6fa0", "#4a7e28",
];

const TYPE_LABELS: Record<string, string> = {
  perps: "Perps", prediction: "Prediction", dex: "DEX", cex: "CEX",
  lending: "Lending", staking: "Staking", wallet: "Wallet", other: "Other",
};

function buildExplorers(platformName: string, wallet: string): { name: string; url: string; domain: string }[] {
  const lcName = platformName.toLowerCase();

  if (lcName === "hyperliquid") return [
    { name: "Hyperliquid", url: `https://app.hyperliquid.xyz/explorer/address/${wallet}`, domain: "app.hyperliquid.xyz" },
    { name: "Hypurrscan", url: `https://hypurrscan.io/address/${wallet}`, domain: "hypurrscan.io" },
  ];

  if (lcName === "polymarket") return [
    { name: "Polymarket", url: `https://polymarket.com/profile/${wallet}`, domain: "polymarket.com" },
    { name: "PolygonScan", url: `https://polygonscan.com/address/${wallet}`, domain: "polygonscan.com" },
  ];

  // Generic EVM (Wallet, DEX, Lending, Staking, etc.)
  return [
    { name: "DeBank", url: `https://debank.com/profile/${wallet}`, domain: "debank.com" },
    { name: "Etherscan", url: `https://etherscan.io/address/${wallet}`, domain: "etherscan.io" },
    { name: "Zerion", url: `https://app.zerion.io/${wallet}/overview`, domain: "app.zerion.io" },
  ];
}

export default async function VerifyPage() {
  const dc = await resolvePublicClient();
  const demo = await isDemoMode(dc);

  if (demo) {
    return <VerifyClient platforms={DEMO_PLATFORMS} totalValue={10450} dailyData={DEMO_DAILY} capitalInvested={8500} summary={{ totalValue: 10450, totalCost: 8500, totalPnl: 1950, totalRoiPct: 22.94 }} isDemo platformColorsLight={PLATFORM_COLORS_LIGHT} />;
  }

  let summary, positions, allPlatforms, snapshots, costBasis;
  try {
    [summary, positions, allPlatforms, snapshots, costBasis] = await Promise.all([
      getPortfolioSummary(dc),
      getPositions(dc),
      getPlatforms(dc),
      getDailySnapshots(30, dc),
      getCostBasis(dc),
    ]);
  } catch (e) {
    console.error("Verify page data fetch failed:", e);
    return <VerifyClient platforms={DEMO_PLATFORMS} totalValue={10450} dailyData={DEMO_DAILY} capitalInvested={8500} summary={{ totalValue: 10450, totalCost: 8500, totalPnl: 1950, totalRoiPct: 22.94 }} isDemo platformColorsLight={PLATFORM_COLORS_LIGHT} />;
  }

  const totalValue = summary?.total_value ?? 0;

  const verifyPlatforms: VerifyPlatform[] = allPlatforms
    .map((pl, i) => {
      const plPositions = positions.filter((p) => p.platform_id === pl.id);
      if (plPositions.length === 0) return null;
      const value = plPositions.reduce((sum, p) => sum + p.current_value, 0);

      // Match against KNOWN_PLATFORMS for icon
      const preset = KNOWN_PLATFORMS.find(
        (k) => k.name.toLowerCase() === pl.name.toLowerCase(),
      );

      return {
        name: pl.name,
        type: TYPE_LABELS[pl.type ?? "other"] ?? pl.type ?? "Other",
        value,
        positionCount: plPositions.length,
        allocationPct: totalValue > 0 ? (value / totalValue) * 100 : 0,
        walletAddress: pl.wallet_address,
        explorers: pl.wallet_address ? buildExplorers(pl.name, pl.wallet_address) : [],
        color: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
        icon: preset?.icon ?? "",
        iconViewBox: preset?.iconViewBox ?? "0 0 24 24",
        iconFillRule: preset?.iconFillRule,
      } as VerifyPlatform;
    })
    .filter((p): p is VerifyPlatform => p !== null)
    .sort((a, b) => b.value - a.value);

  const dailyData = snapshots
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((s) => ({
      day: new Date(s.snapshot_date).toLocaleDateString("es", { weekday: "short" }),
      total: s.total_value,
    }));

  const capitalInvested = costBasis.net > 0 ? costBasis.net : null;

  return (
    <VerifyClient
      platforms={verifyPlatforms}
      totalValue={totalValue}
      dailyData={dailyData}
      capitalInvested={capitalInvested}
      summary={
        summary
          ? {
              totalValue: summary.total_value,
              totalCost: summary.total_cost,
              totalPnl: summary.total_pnl,
              totalRoiPct: summary.total_roi_pct,
            }
          : null
      }
      platformColorsLight={PLATFORM_COLORS_LIGHT}
    />
  );
}

/* ─── Demo fallback data ─── */

const DEMO_DAILY = [
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

const DEMO_PLATFORMS: VerifyPlatform[] = [
  {
    name: "Hyperliquid", type: "Perps", value: 3970, positionCount: 2,
    allocationPct: 38.0, walletAddress: "0x1a2b...9f0e",
    explorers: [
      { name: "Hyperliquid", url: "#", domain: "app.hyperliquid.xyz" },
      { name: "Hypurrscan", url: "#", domain: "hypurrscan.io" },
    ],
    color: "#5BAA7C",
    icon: KNOWN_PLATFORMS[0].icon, iconViewBox: "0 0 144 144",
  },
  {
    name: "Polymarket", type: "Prediction", value: 2090, positionCount: 2,
    allocationPct: 20.0, walletAddress: "0x5e6f...2c3d",
    explorers: [
      { name: "Polymarket", url: "#", domain: "polymarket.com" },
      { name: "PolygonScan", url: "#", domain: "polygonscan.com" },
    ],
    color: "#6B8EA0",
    icon: KNOWN_PLATFORMS[1].icon, iconViewBox: "0 0 43 53", iconFillRule: "evenodd",
  },
  {
    name: "Wallet", type: "Wallet", value: 2930, positionCount: 2,
    allocationPct: 28.0, walletAddress: "0x3c4d...7a1b",
    explorers: [
      { name: "DeBank", url: "#", domain: "debank.com" },
      { name: "Etherscan", url: "#", domain: "etherscan.io" },
      { name: "Zerion", url: "#", domain: "app.zerion.io" },
    ],
    color: "#C9A84C",
    icon: KNOWN_PLATFORMS[2].icon, iconViewBox: "0 0 24 24",
  },
  {
    name: "Uniswap", type: "DEX", value: 1460, positionCount: 1,
    allocationPct: 14.0, walletAddress: "0x7a8b...4e5f",
    explorers: [
      { name: "DeBank", url: "#", domain: "debank.com" },
      { name: "Etherscan", url: "#", domain: "etherscan.io" },
      { name: "Zerion", url: "#", domain: "app.zerion.io" },
    ],
    color: "#8B6BBF",
    icon: "", iconViewBox: "0 0 24 24",
  },
];
