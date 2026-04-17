import {
  getPortfolioSummary,
  getPositions,
  getPlatforms,
  getDailySnapshots,
  getCostBasis,
  isDemoMode,
  resolvePublicClient,
} from "@/lib/supabase/queries";
import { createPostsClient } from "@/lib/supabase/posts-client";
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

const PLATFORM_COLORS_LIGHT = [
  "#358a55",
  "#3a6d88",
  "#8a7020",
  "#6040a0",
  "#a8333a",
  "#b05a30",
  "#2e6fa0",
  "#4a7e28",
];

const TYPE_LABELS: Record<string, string> = {
  perps: "Perps",
  prediction: "Prediction",
  dex: "DEX",
  cex: "CEX",
  lending: "Lending",
  staking: "Staking",
  wallet: "Wallet",
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
    url: "https://x.com/chamillion__",
  },
};

export default async function HomePage() {
  const dc = await resolvePublicClient();
  const demo = await isDemoMode(dc);

  // Fetch recent published posts
  let recentPosts: { slug: string; title: string; subtitle: string | null; date: string; banner_path: string | null; substack_url: string | null }[] = [];
  try {
    const postsDb = createPostsClient();
    const { data } = await postsDb
      .from("posts")
      .select("slug, title, subtitle, date, banner_path, substack_url")
      .eq("published", true)
      .order("date", { ascending: false })
      .limit(5);
    recentPosts = data ?? [];
  } catch { /* fallback: no posts shown */ }

  if (demo) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HomeClient {...DEMO_DATA} isDemo platformColorsLight={PLATFORM_COLORS_LIGHT} recentPosts={recentPosts} />
      </>
    );
  }

  let summary, positions, allPlatforms, snapshots, costBasis;
  try {
    [summary, positions, allPlatforms, snapshots, costBasis] = await Promise.all([
      getPortfolioSummary(dc),
      getPositions(dc),
      getPlatforms(dc),
      getDailySnapshots(365, dc),
      getCostBasis(dc),
    ]);
  } catch (e) {
    console.error("Homepage data fetch failed:", e);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HomeClient {...DEMO_DATA} isDemo platformColorsLight={PLATFORM_COLORS_LIGHT} />
      </>
    );
  }

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
      date: s.snapshot_date.slice(0, 10),
      day: new Date(s.snapshot_date).toLocaleDateString("es", {
        weekday: "short",
      }),
      total: s.total_value,
      cost: s.total_cost,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        platformColorsLight={PLATFORM_COLORS_LIGHT}
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
        recentPosts={recentPosts}
      />
    </>
  );
}
