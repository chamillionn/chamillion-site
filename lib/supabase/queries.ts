import { createClient } from "./server";
import type {
  Platform,
  Strategy,
  PositionEnriched,
  PortfolioSummary,
  Snapshot,
  Profile,
} from "./types";

/* ── Portfolio (public reads — no auth needed) ── */

export async function getPortfolioSummary(): Promise<PortfolioSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_summary")
    .select("*")
    .single();
  return data as PortfolioSummary | null;
}

export async function getPositions(): Promise<PositionEnriched[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("positions_enriched")
    .select("*")
    .order("allocation_pct", { ascending: false });
  return (data as PositionEnriched[]) ?? [];
}

export async function getStrategies(): Promise<Strategy[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("strategies")
    .select("*")
    .order("name");
  return (data as Strategy[]) ?? [];
}

export async function getPlatforms(): Promise<Platform[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platforms")
    .select("*")
    .order("name");
  return (data as Platform[]) ?? [];
}

export async function getSnapshots(limit = 30): Promise<Snapshot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(limit);
  return (data as Snapshot[]) ?? [];
}

/* ── User (requires auth) ── */

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data as Profile | null;
}
