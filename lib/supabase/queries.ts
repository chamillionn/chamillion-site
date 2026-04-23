import { createClient } from "./server";
import type {
  Platform,
  Strategy,
  PositionEnriched,
  PortfolioSummary,
  Snapshot,
  SnapshotSummary,
  SnapshotPosition,
  CapitalFlow,
  Profile,
} from "./types";

type DataClient = Awaited<ReturnType<typeof createClient>>;

async function resolve(client?: DataClient) {
  return client ?? (await createClient());
}

/**
 * In development, honours the admin-db-target cookie so public pages
 * can preview prod data. In production, returns the normal anon client.
 */
export async function resolvePublicClient(): Promise<DataClient> {
  if (process.env.NODE_ENV === "development") {
    const { createTargetClient } = await import("./admin-db");
    return createTargetClient() as Promise<DataClient>;
  }
  return createClient();
}

/* ── Portfolio (public reads — no auth needed) ── */

export async function getPortfolioSummary(client?: DataClient): Promise<PortfolioSummary | null> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("portfolio_summary")
    .select("*")
    .single();
  return data as PortfolioSummary | null;
}

export async function getPositions(client?: DataClient): Promise<PositionEnriched[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("positions_enriched")
    .select("*")
    .order("allocation_pct", { ascending: false });
  return (data as PositionEnriched[]) ?? [];
}

export async function getStrategies(client?: DataClient): Promise<Strategy[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("strategies")
    .select("*")
    .order("name");
  return (data as Strategy[]) ?? [];
}

export async function getPlatforms(client?: DataClient): Promise<Platform[]> {
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
export async function getDailySnapshots(days = 30, client?: DataClient): Promise<Snapshot[]> {
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
export async function getSnapshots(limit = 100, client?: DataClient): Promise<Snapshot[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(limit);
  return (data as Snapshot[]) ?? [];
}

/**
 * Lightweight paged snapshots for list views (excludes positions_data JSON).
 * Returns rows + total count so the caller can know when to stop paging.
 */
export async function getSnapshotsPaged(
  offset: number,
  limit: number,
  client?: DataClient,
): Promise<{ rows: SnapshotSummary[]; total: number }> {
  const supabase = await resolve(client);
  const { data, count } = await supabase
    .from("snapshots")
    .select("id, snapshot_date, total_value, total_cost, eurusd_rate, notes, created_at", { count: "exact" })
    .order("snapshot_date", { ascending: false })
    .range(offset, offset + limit - 1);
  return { rows: (data as SnapshotSummary[]) ?? [], total: count ?? 0 };
}

/**
 * Chart-friendly snapshot series covering full history:
 * dense (all rows) for the last `denseDays`, and 1 point per day for older data.
 * Returns rows newest-first (matches convention of other snapshot queries).
 */
export async function getSnapshotsForChart(
  denseDays = 30,
  client?: DataClient,
): Promise<SnapshotSummary[]> {
  const supabase = await resolve(client);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - denseDays);
  const cutoffISO = cutoff.toISOString();
  const cols = "id, snapshot_date, total_value, total_cost, eurusd_rate, notes, created_at";

  const [recent, older] = await Promise.all([
    supabase
      .from("snapshots")
      .select(cols)
      .gte("snapshot_date", cutoffISO)
      .order("snapshot_date", { ascending: false })
      .range(0, 9999),
    supabase
      .from("snapshots")
      .select(cols)
      .lt("snapshot_date", cutoffISO)
      .order("snapshot_date", { ascending: false })
      .range(0, 9999),
  ]);

  const recentRows = (recent.data as SnapshotSummary[]) ?? [];
  const olderRows = (older.data as SnapshotSummary[]) ?? [];

  // Older: keep latest snapshot per calendar day (input is desc, first wins)
  const byDay = new Map<string, SnapshotSummary>();
  for (const s of olderRows) {
    const day = s.snapshot_date.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, s);
  }
  const daily = [...byDay.values()]; // already desc since input was desc

  return [...recentRows, ...daily];
}

/** Fetch positions_data for a single snapshot (lazy-loaded on row expand). */
export async function getSnapshotPositions(
  id: string,
  client?: DataClient,
): Promise<SnapshotPosition[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("snapshots")
    .select("positions_data")
    .eq("id", id)
    .single();
  const row = data as { positions_data: SnapshotPosition[] | null } | null;
  return row?.positions_data ?? [];
}

/** Get all snapshots for a specific date (YYYY-MM-DD). */
export async function getSnapshotsByDate(date: string, client?: DataClient): Promise<Snapshot[]> {
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

export async function getCapitalFlows(limit = 200, client?: DataClient): Promise<CapitalFlow[]> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("capital_flows")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  return (data as CapitalFlow[]) ?? [];
}

/** Total EUR invested (buys + fiat deposits - sells - withdrawals). */
export async function getCostBasis(client?: DataClient): Promise<{ invested: number; withdrawn: number; net: number }> {
  const supabase = await resolve(client);
  const { data } = await supabase.from("capital_flows").select("type, amount_eur");
  const flows = (data as { type: string; amount_eur: number }[]) ?? [];

  let invested = 0;
  let withdrawn = 0;
  for (const f of flows) {
    if (f.type === "buy" || f.type === "deposit_fiat") invested += f.amount_eur;
    else if (f.type === "sell" || f.type === "withdraw_fiat") withdrawn += f.amount_eur;
  }
  return { invested, withdrawn, net: invested - withdrawn };
}

/* ── Site settings ── */

export async function isDemoMode(client?: DataClient): Promise<boolean> {
  const supabase = await resolve(client);
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "demo_mode")
    .single();
  return data?.value === true;
}

/* ── Admin (all positions including closed) ── */

export async function getAllPositions(client?: DataClient) {
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
