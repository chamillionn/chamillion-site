import {
  fetchMarketPrices,
  fetchOrderbook,
  midFromBook,
  type MarketPriceSnapshot,
  type Orderbook,
} from "@/lib/polymarket-api";
import type { AnalysisSnapshot } from "@/lib/supabase/types";
import { POLYMARKET_EVENT, MARKET_BUCKETS } from "../data";
import MarketsPanelClient, { type SrEntry } from "./markets-panel-client";

interface Props {
  snapshot: AnalysisSnapshot | null;
  currentMtdMm: number;
}

interface PositionLeg {
  marketSlug?: string;
  side?: string;
  size?: number;
  avgPrice?: number;
  curPrice?: number;
  cashPnl?: number;
  pnlPct?: number;
}

interface PositionFromSnapshot {
  legs?: PositionLeg[];
  totalCashPnl?: number;
  totalNotional?: number;
}

const BUCKET_ORDER: { range: string; key: keyof typeof POLYMARKET_EVENT.submarketSlugs }[] = [
  { range: "<40", key: "under40" },
  { range: "40-45", key: "b40_45" },
  { range: "45-50", key: "b45_50" },
  { range: "50-55", key: "b50_55" },
  { range: "55-60", key: "b55_60" },
  { range: "60-65", key: "b60_65" },
  { range: "65-70", key: "b65_70" },
  { range: "70-75", key: "b70_75" },
  { range: "75+", key: "over75" },
];

/**
 * Server: fetcha precios live de los 9 sub-markets vía Gamma + extrae mi
 * posición del snapshot tracker. Para posiciones owned, fetcha además el
 * orderbook y computa el MID (best_bid + best_ask)/2 — éste es el "mark"
 * que coincide con el que Polymarket muestra en la cartera del usuario.
 * El curPrice del endpoint /positions de Polymarket no siempre matchea.
 *
 * PnL se recalcula desde el mid real:
 *   YES leg: cashPnl = size × (mid − avgPrice)
 *   NO leg:  cashPnl = size × ((1 − mid) − avgPrice)   [NO se redenomina como 1−YES]
 *   pnlPct  = cashPnl / (size × avgPrice) × 100
 */
export default async function MarketsPanel({ snapshot, currentMtdMm }: Props) {
  const slugs = Object.values(POLYMARKET_EVENT.submarketSlugs);

  // Snapshot position legs
  const position = (snapshot?.position as PositionFromSnapshot | null) ?? null;
  const legsBySlug = new Map<string, PositionLeg>();
  for (const leg of position?.legs ?? []) {
    if (leg.marketSlug) legsBySlug.set(leg.marketSlug, leg);
  }

  // 1) Live Gamma prices (yields tokenIds for each side)
  let live: Record<string, MarketPriceSnapshot> = {};
  try {
    live = await fetchMarketPrices(slugs, { signal: AbortSignal.timeout(8_000) });
  } catch {
    live = {};
  }

  // 2) Owned slugs → fetch orderbook for the side actually held
  const ownedJobs: { slug: string; side: "yes" | "no"; tokenId: string | null }[] = [];
  for (const { key } of BUCKET_ORDER) {
    const slug = POLYMARKET_EVENT.submarketSlugs[key];
    const leg = legsBySlug.get(slug);
    if (!leg) continue;
    const side: "yes" | "no" =
      (leg.side ?? "yes").toLowerCase() === "no" ? "no" : "yes";
    const tokenId =
      side === "yes" ? live[slug]?.yesTokenId ?? null : live[slug]?.noTokenId ?? null;
    ownedJobs.push({ slug, side, tokenId });
  }

  const books = await Promise.all(
    ownedJobs.map(async (j) =>
      j.tokenId
        ? { slug: j.slug, side: j.side, book: await fetchOrderbook(j.tokenId) }
        : { slug: j.slug, side: j.side, book: null as Orderbook | null },
    ),
  );
  const midBySlug = new Map<string, number>();
  for (const { slug, book } of books) {
    const m = midFromBook(book);
    if (m != null) midBySlug.set(slug, m);
  }

  // 3) Build SR entries
  let recomputedNotional = 0;
  let recomputedPnl = 0;

  const entries: SrEntry[] = BUCKET_ORDER.map(({ range, key }) => {
    const slug = POLYMARKET_EVENT.submarketSlugs[key];
    const bucket = MARKET_BUCKETS.find((b) => b.range === range || b.range === `${range}mm`);
    const liveData = live[slug];
    const leg = legsBySlug.get(slug);

    const yesPrice = liveData?.yesPrice ?? bucket?.yesPrice ?? 0;
    const noPrice = liveData?.noPrice ?? bucket?.noPrice ?? 0;
    const volume = liveData?.volume ?? bucket?.volume ?? 0;

    let positionOut: SrEntry["position"] = null;
    if (leg) {
      const side: "yes" | "no" = (leg.side ?? "yes").toLowerCase() === "no" ? "no" : "yes";
      const size = leg.size ?? 0;
      const avgPrice = leg.avgPrice ?? 0;
      // Prefer live mid from orderbook (matches Polymarket's "mark" in the
      // user's portfolio). Fall back to Gamma's quoted price for the side
      // we hold — note that on resolved markets Gamma returns exact 0/1
      // (loser/winner) and we MUST respect 0 as a valid value, not skip it.
      // Final fallback is the snapshot's persisted curPrice.
      const sideQuote = side === "yes" ? yesPrice : noPrice;
      const curPrice =
        midBySlug.get(slug) ??
        (Number.isFinite(sideQuote) ? sideQuote : null) ??
        leg.curPrice ??
        null;

      let cashPnl = 0;
      let pnlPct = 0;
      if (curPrice != null && Number.isFinite(curPrice) && size > 0 && avgPrice > 0) {
        cashPnl = size * (curPrice - avgPrice);
        pnlPct = ((curPrice - avgPrice) / avgPrice) * 100;
      } else {
        cashPnl = leg.cashPnl ?? 0;
        pnlPct = leg.pnlPct ?? 0;
      }

      recomputedNotional += size * avgPrice;
      recomputedPnl += cashPnl;

      positionOut = { side, size, avgPrice, curPrice, cashPnl, pnlPct };
    }

    return {
      range,
      slug,
      yesPrice,
      noPrice,
      volume,
      yesTokenId: liveData?.yesTokenId ?? null,
      noTokenId: liveData?.noTokenId ?? null,
      position: positionOut,
    };
  });

  // Use recomputed totals when we have any owned positions; otherwise fall
  // back to the snapshot's persisted aggregate.
  const hasOwned = entries.some((e) => e.position);
  const totalCashPnl = hasOwned ? recomputedPnl : position?.totalCashPnl ?? null;
  const totalNotional = hasOwned ? recomputedNotional : position?.totalNotional ?? null;

  const fetchedAt = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <MarketsPanelClient
      entries={entries}
      mtdMm={currentMtdMm}
      stripMax={80}
      totalCashPnl={totalCashPnl}
      totalNotional={totalNotional}
      fetchedAt={fetchedAt}
    />
  );
}
