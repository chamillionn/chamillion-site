import {
  getPortfolioSummary,
  getPositions,
  getDailySnapshots,
  getPlatforms,
  getStrategies,
  getCostBasis,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { TradeEnriched } from "@/lib/supabase/types";
import CarteraClient from "./cartera-client";

export const metadata = { title: "Cartera" };

async function getRecentTrades(limit = 50): Promise<TradeEnriched[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades_enriched")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(limit);
  return (data as TradeEnriched[]) ?? [];
}

export default async function CarteraPage() {
  const [summary, positions, trades, snapshots, platforms, strategies, costBasis] =
    await Promise.all([
      getPortfolioSummary(),
      getPositions(),
      getRecentTrades(),
      getDailySnapshots(90),
      getPlatforms(),
      getStrategies(),
      getCostBasis(),
    ]);

  return (
    <CarteraClient
      summary={summary}
      positions={positions}
      trades={trades}
      snapshots={snapshots}
      platforms={platforms}
      strategies={strategies}
      capitalInvested={costBasis.net}
    />
  );
}
