import { createClient } from "./server";
import type {
  Platform,
  Strategy,
  PositionEnriched,
  PortfolioSummary,
  Snapshot,
  CapitalFlow,
  Profile,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (...args: any[]) => any };

async function resolve(client?: AnyClient) {
  return client ?? (await createClient());
}

/* ── Portfolio (public reads — no auth needed) ── */

export async function getPortfolioSummary(client?: AnyClient): Promise<PortfolioSummary | null> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("portfolio_summary")
    .select("*")
    .single();
  return data as PortfolioSummary | null;
}

export async function getPositions(client?: AnyClient): Promise<PositionEnriched[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("positions_enriched")
    .select("*")
    .order("allocation_pct", { ascending: false });
  return (data as PositionEnriched[]) ?? [];
}

export async function getStrategies(client?: AnyClient): Promise<Strategy[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("strategies")
    .select("*")
    .order("name");
  return (data as Strategy[]) ?? [];
}

export async function getPlatforms(client?: AnyClient): Promise<Platform[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("platforms")
    .select("*")
    .order("name");
  return (data as Platform[]) ?? [];
}

/**
 * Get daily snapshots for the homepage chart.
 * Snapshots are stored every 15 min — this deduplicates to 1 per day (latest).
 */
export async function getDailySnapshots(days = 30, client?: AnyClient): Promise<Snapshot[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("snapshots")
    .select("id, snapshot_date, total_value, total_cost, created_at")
    .order("snapshot_date", { ascending: false })
    .limit(days * 96);

  const all = (data as Snapshot[]) ?? [];

  const byDay = new Map<string, Snapshot>();
  for (const s of all) {
    const day = s.snapshot_date.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, s);
  }

  return [...byDay.values()].slice(0, days);
}

/** Get raw snapshots (all granularity). */
export async function getSnapshots(limit = 100, client?: AnyClient): Promise<Snapshot[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(limit);
  return (data as Snapshot[]) ?? [];
}

/** Get all snapshots for a specific date (YYYY-MM-DD). */
export async function getSnapshotsByDate(date: string, client?: AnyClient): Promise<Snapshot[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("snapshots")
    .select("*")
    .gte("snapshot_date", `${date}T00:00:00`)
    .lt("snapshot_date", `${date}T23:59:59.999`)
    .order("snapshot_date", { ascending: false });
  return (data as Snapshot[]) ?? [];
}

/* ── Capital flows ── */

export async function getCapitalFlows(limit = 200, client?: AnyClient): Promise<CapitalFlow[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("capital_flows")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  return (data as CapitalFlow[]) ?? [];
}

/** Total EUR invested (buys + fiat deposits - sells - withdrawals). */
export async function getCostBasis(client?: AnyClient): Promise<{ invested: number; withdrawn: number; net: number }> {
  const supabase = await resolve(client);
  const { data } = await supabase.from("capital_flows").select("type, amount_eur");
  const flows = (data as { type: string; amount_eur: number }[]) ?? [];

  let invested = 0;
  let withdrawn = 0;
  for (const f of flows) {
    if (f.type === "buy" || f.type === "deposit_fiat") invested += f.amount_eur;
    else withdrawn += f.amount_eur;
  }
  return { invested, withdrawn, net: invested - withdrawn };
}

/* ── Site settings ── */

export async function isDemoMode(client?: AnyClient): Promise<boolean> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "demo_mode")
    .single();
  return data?.value === true;
}

/* ── Admin (all positions including closed) ── */

export async function getAllPositions(client?: AnyClient) {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("positions")
    .select("*, platforms(name), strategies(name)")
    .order("is_active", { ascending: false })
    .order("opened_at", { ascending: false });
  return (data ?? []) as Array<
    import("./types").Position & {
      platforms: { name: string } | null;
      strategies: { name: string } | null;
    }
  >;
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
