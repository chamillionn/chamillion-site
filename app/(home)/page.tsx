import {
  getPortfolioSummary,
  getPositions,
  getPlatforms,
  getDailySnapshots,
  getCostBasis,
  isDemoMode,
} from "@/lib/supabase/queries";
import HomeClient from "./home-client";
import { DEMO_DATA } from "@/lib/dummy-data";

const PLATFORM_COLORS = [
  "#5BAA7C",
  "#6B8EA0",
  "#C9A84C",
  "#8B6BBF",
  "#C7555A",
  "#E08A5E",
  "#5B9BD5",
  "#8BC34A",
];

const TYPE_LABELS: Record<string, string> = {
  perps: "Perps",
  prediction: "Prediction",
  dex: "DEX",
  cex: "CEX",
  lending: "Lending",
  staking: "Staking",
  other: "Other",
};

export const revalidate = 300; // ISR: revalidate every 5 min

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Chamillion",
  url: "https://chamillion.site",
  description:
    "Documentando la vanguardia de los mercados financieros, y haciendo dinero. Con un ojo en cada pantalla.",
  author: {
    "@type": "Person",
    name: "Chamillion",
    url: "https://x.com/chamillionnnnn",
  },
};

export default async function HomePage() {
  const demo = await isDemoMode();

  if (demo) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HomeClient {...DEMO_DATA} isDemo />
      </>
    );
  }

  const [summary, positions, allPlatforms, snapshots, costBasis] = await Promise.all([
    getPortfolioSummary(),
    getPositions(),
    getPlatforms(),
    getDailySnapshots(30),
    getCostBasis(),
  ]);

  // Group positions by platform, sorted by value desc
  const platforms = allPlatforms
    .map((pl, i) => {
      const plPositions = positions.filter((p) => p.platform_id === pl.id);
      const value = plPositions.reduce((sum, p) => sum + p.current_value, 0);
      return {
        name: pl.name,
        chain: TYPE_LABELS[pl.type ?? "other"] ?? pl.type ?? "Other",
        value,
        color: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
        walletAddress: pl.wallet_address,
        positions: plPositions.map((p) => ({
          name: p.asset,
          value: p.current_value,
          pnl: p.pnl,
          pnlPercent: p.roi_pct.toFixed(2),
        })),
      };
    })
    .filter((g) => g.positions.length > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue =
    summary?.total_value ??
    platforms.reduce((sum, g) => sum + g.value, 0);

  // Map snapshots for chart (chronological)
  const dailyData = snapshots
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((s) => ({
      day: new Date(s.snapshot_date).toLocaleDateString("es", {
        weekday: "short",
      }),
      total: s.total_value,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
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
        platforms={platforms}
        totalValue={totalValue}
        dailyData={dailyData}
        capitalInvested={costBasis.net > 0 ? costBasis.net : null}
      />
    </>
  );
}
