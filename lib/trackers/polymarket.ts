import {
  fetchUserPositions,
  fetchUserActivity,
  fetchUserOpenOrders,
  fetchMarketPrices,
  type UserPosition,
  type UserActivity,
  type UserOpenOrder,
} from "@/lib/polymarket-api";
import type {
  TrackerPosition,
  TrackerPositionLeg,
  TrackerEdge,
  AnalysisEventType,
  AnalysisEventSource,
} from "@/lib/supabase/types";
import type { RegistryTrackerPolymarket } from "@/app/analisis/registry";
import type { TickResult, TrackerResolver } from "./types";

/**
 * Polymarket tracker resolver.
 *
 * Each tick:
 *  - Fetches current user positions (filtering to tracked marketSlugs).
 *  - Fetches current market prices for those slugs.
 *  - Fetches recent activity (trades) to emit order_* events.
 *  - Computes a simple edge snapshot from position PnL.
 *
 * The underlying value is NOT fetched here — for Seoul, the underlying comes
 * from manual KMA observations (underlyingSource='manual'). The cron merges
 * the latest observation with this tick's position + edge.
 */
export const polymarketResolver: TrackerResolver<RegistryTrackerPolymarket> =
  async (analysis, cfg, opts) => {
    const warnings: string[] = [];
    // Resolve wallet: explicit override → platforms table default.
    let wallet = cfg.walletAddress ?? "";
    if (!wallet) {
      const { data } = await opts.db
        .from("platforms")
        .select("wallet_address")
        .ilike("name", "polymarket")
        .maybeSingle();
      wallet = data?.wallet_address ?? "";
    }

    if (!wallet) {
      warnings.push(
        "Sin wallet para Polymarket — ni override en registry ni fila 'Polymarket' en platforms.",
      );
      return {
        underlying: null,
        position: null,
        edge: null,
        events: [],
        warnings,
      };
    }

    const slugSet = new Set(cfg.marketSlugs);

    // Run the fetches in parallel to minimise latency.
    const [allPositions, prices, activity, openOrders] = await Promise.all([
      fetchUserPositions(wallet, { signal: opts?.signal }).catch((e) => {
        warnings.push(`fetchUserPositions: ${String(e)}`);
        return [] as UserPosition[];
      }),
      fetchMarketPrices(cfg.marketSlugs, { signal: opts?.signal }).catch((e) => {
        warnings.push(`fetchMarketPrices: ${String(e)}`);
        return {} as Record<string, { yesPrice: number | null; noPrice: number | null }>;
      }),
      fetchUserActivity(wallet, { signal: opts?.signal, limit: 100 }).catch(
        (e) => {
          warnings.push(`fetchUserActivity: ${String(e)}`);
          return [] as UserActivity[];
        },
      ),
      fetchUserOpenOrders(wallet, { signal: opts?.signal, limit: 200 }).catch(
        (e) => {
          warnings.push(`fetchUserOpenOrders: ${String(e)}`);
          return [] as UserOpenOrder[];
        },
      ),
    ]);

    // Debug breadcrumbs (helpful when first wiring up a new analysis)
    warnings.push(
      `debug: wallet=${wallet.slice(0, 6)}… · positions(all)=${allPositions.length} · positions(tracked)=${allPositions.filter((p) => slugSet.has(p.slug)).length} · openOrders(all)=${openOrders.length} · activity=${activity.length}`,
    );

    // Filter positions to the tracked markets
    const tracked = allPositions.filter((p) => slugSet.has(p.slug));

    // Build position snapshot
    const legs: TrackerPositionLeg[] = tracked.map((p) => ({
      name: p.title?.length > 50 ? p.title.slice(0, 47) + "..." : p.title,
      side: /^yes$/i.test(p.outcome) ? "YES" : "NO",
      size: p.size,
      avgPrice: p.avgPrice,
      curPrice: p.curPrice,
      cashPnl: p.cashPnl,
      pnlPct: p.percentPnl,
      marketSlug: p.slug,
      conditionId: p.conditionId,
    }));

    const totalCashPnl = legs.reduce((a, b) => a + b.cashPnl, 0);
    const totalNotional = tracked.reduce((a, b) => a + (b.initialValue ?? 0), 0);

    const position: TrackerPosition | null = legs.length
      ? { legs, totalCashPnl, totalNotional }
      : null;

    // Compute edge — simple version: EV in cents per contract if you bought at
    // current market, using the same "my probability" logic the analyst already
    // declared in the prediction (baseline/target comparison). More refined
    // edge (e.g. ensemble-backed probability) comes from an overridable
    // edgeCompute hook — out of scope for MVP.
    const edge = computeSimpleEdge(analysis, prices, cfg.marketSlugs);

    // Event log: translate recent activity + current open orders into our
    // event schema. Dedup by hash/order id so repeat runs don't duplicate.
    const events = [
      ...buildActivityEvents(activity, slugSet),
      ...buildOpenOrderEvents(openOrders, slugSet),
    ];

    return {
      underlying: null, // filled in by the cron from analysis_observations
      position,
      edge,
      events,
      warnings,
    };
  };

/**
 * Simple edge: from the analyst's perspective, long YES on the bucket that
 * best matches `prediction_direction` (bearish = a sub-threshold bucket).
 * Returns null if not derivable.
 */
function computeSimpleEdge(
  analysis: Parameters<TrackerResolver<RegistryTrackerPolymarket>>[0],
  prices: Record<string, { yesPrice: number | null; noPrice: number | null }>,
  marketSlugs: string[],
): TrackerEdge | null {
  const target = analysis.prediction_target_value;
  if (target == null) return null;
  // Use the first market slug as "primary" by convention. The registry lists
  // marketSlugs with the primary thesis first. For Seoul: <40 is index 0.
  const primary = marketSlugs[0];
  const p = prices[primary];
  if (!p || p.yesPrice == null) return null;
  // myProb: we don't recompute here; the analyst-stated probability is encoded
  // downstream. For MVP, use a neutral heuristic of (1 - yesPrice) as mktProb
  // and leave myProb=null until the edgeCompute hook is wired.
  const mktProb = p.yesPrice;
  return {
    evAbs: 0,
    evPct: 0,
    myProb: 0,
    mktProb,
    source: "polymarket-mvp",
    note: "Edge MVP — requires per-analysis edgeCompute hook for real EV",
  };
}

/**
 * Convert open (resting) limit orders into analysis_events entries of type
 * `order_placed`. Dedup key is the CLOB order hash so repeat ticks don't
 * duplicate. Already-filled orders disappear from this list naturally.
 */
function buildOpenOrderEvents(
  orders: UserOpenOrder[],
  slugSet: Set<string>,
): TickResult["events"] {
  const out: TickResult["events"] = [];
  for (const o of orders) {
    const slug = typeof o.slug === "string" ? o.slug : null;
    if (!slug || !slugSet.has(slug)) continue;

    const occurred_at = o.createdAt ?? new Date().toISOString();
    const dedup_key =
      typeof o.orderHash === "string" && o.orderHash.length > 0
        ? `poly-ord:${o.orderHash}`
        : `poly-ord:${slug}:${occurred_at}:${o.side ?? ""}:${o.size ?? ""}:${o.price ?? ""}`;

    out.push({
      occurred_at,
      type: "order_placed",
      source: "polymarket" as AnalysisEventSource,
      dedup_key,
      payload: {
        slug,
        outcome: o.outcome,
        side: o.side,
        price: o.price,
        size: o.size,
        filledSize: o.filledSize,
        remainingSize: o.remainingSize,
        orderHash: o.orderHash,
        status: "open",
      },
    });
  }
  return out;
}

/**
 * Convert Polymarket activity records into analysis_events entries.
 * Keeps only trades on the tracked markets. Dedup key is the tx hash.
 */
function buildActivityEvents(
  activity: UserActivity[],
  slugSet: Set<string>,
): TickResult["events"] {
  const out: TickResult["events"] = [];
  for (const a of activity) {
    const slug =
      typeof a.slug === "string"
        ? a.slug
        : typeof a.market === "string"
          ? a.market
          : null;
    if (!slug || !slugSet.has(slug)) continue;

    const tsSec =
      typeof a.timestamp === "string"
        ? Math.floor(Date.parse(a.timestamp) / 1000)
        : Number(a.timestamp);
    if (!Number.isFinite(tsSec)) continue;

    const occurred_at = new Date(tsSec * 1000).toISOString();
    const typeRaw = typeof a.type === "string" ? a.type.toUpperCase() : "";

    let type: AnalysisEventType = "note";
    if (typeRaw === "TRADE") type = "order_filled";
    else if (typeRaw === "ORDER_PLACED") type = "order_placed";
    else if (typeRaw === "ORDER_CANCELLED") type = "order_cancelled";
    else continue; // skip SPLIT / MERGE / REWARD etc.

    const source: AnalysisEventSource = "polymarket";
    const dedup_key =
      typeof a.transactionHash === "string" && a.transactionHash.length > 0
        ? `poly:${a.transactionHash}`
        : `poly:${slug}:${tsSec}:${a.side ?? ""}:${a.size ?? ""}`;

    out.push({
      occurred_at,
      type,
      source,
      dedup_key,
      payload: {
        slug,
        outcome: a.outcome,
        side: a.side,
        price: a.price,
        size: a.size,
        usdcSize: a.usdcSize,
        transactionHash: a.transactionHash,
      },
    });
  }
  return out;
}
