/**
 * Helpers for the Prediction Analyzer Hub tool.
 * Pure functions + types shared between client and API routes.
 *
 * Polymarket exposes two public APIs:
 *   - Gamma API (markets metadata):  https://gamma-api.polymarket.com
 *   - CLOB API (orderbook):          https://clob.polymarket.com
 */

export const POLYMARKET_GAMMA_URL =
  process.env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com";
export const POLYMARKET_CLOB_URL =
  process.env.POLYMARKET_CLOB_URL ?? "https://clob.polymarket.com";

/* ─── Shared types ─────────────────────────────────────────────── */

export interface SearchResult {
  slug: string;
  question: string;
  endDate: string | null;
  closed: boolean;
  volume?: number;
  icon?: string | null;
}

export interface Outcome {
  /** stable id for React keys */
  id: string;
  /** short title — e.g. "Trump" for events, parent question for single markets */
  title: string;
  /** full question text for this specific market */
  question: string;
  yesTokenId: string | null;
  noTokenId: string | null;
  endDate: string | null;
  closed: boolean;
  /** resolution criteria specific to this sub-market */
  description?: string | null;
  /** per-outcome image (candidate photo for multi-outcome events, etc.) */
  icon?: string | null;
}

export interface ResolvedMarket {
  type: "event" | "market";
  slug: string;
  title: string;
  endDate: string | null;
  closed: boolean;
  outcomes: Outcome[];
  /** parent description (event or binary market) */
  description?: string | null;
  icon?: string | null;
  image?: string | null;
}

export interface OrderLevel {
  price: number;
  size: number;
}

export interface Orderbook {
  bids: OrderLevel[];
  asks: OrderLevel[];
}

/* ─── URL parsing ──────────────────────────────────────────────── */

/**
 * Extract the slug from a Polymarket URL.
 *   https://polymarket.com/event/will-btc-hit-200k  → "will-btc-hit-200k"
 *   https://polymarket.com/market/some-market       → "some-market"
 * Returns null if the input isn't a recognised Polymarket URL.
 */
export function parsePolymarketUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!/polymarket\.com$/i.test(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // expect ["event", "<slug>"] or ["market", "<slug>"]
  if (parts.length < 2) return null;
  if (parts[0] !== "event" && parts[0] !== "market") return null;
  return parts[1] || null;
}

/* ─── Time ─────────────────────────────────────────────────────── */

/**
 * Days remaining until an ISO date. Fractional (not rounded).
 * Returns 0 if the date is past or invalid.
 */
export function daysUntil(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  const then = Date.parse(isoDate);
  if (!Number.isFinite(then)) return 0;
  const diffMs = then - Date.now();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60 * 24);
}

/* ─── APR ──────────────────────────────────────────────────────── */

export interface AprResult {
  apr: number;            // annualised simple return, e.g. 1.42 = 142%
  returnMultiple: number; // gross return if wins, e.g. 0.493
  profitPer100: number;   // USDC profit from a 100 USDC stake
  valid: boolean;
}

/**
 * Compute simple annualised return for a Polymarket position.
 *   returnMultiple = 1 / entryPrice - 1
 *   apr            = returnMultiple × 365 / daysRemaining
 *
 * Returns valid=false if inputs are out of range.
 */
export function computeAPR(args: {
  entryPrice: number;
  daysRemaining: number;
}): AprResult {
  const { entryPrice, daysRemaining } = args;
  const invalid =
    !Number.isFinite(entryPrice) ||
    entryPrice <= 0 ||
    entryPrice >= 1 ||
    !Number.isFinite(daysRemaining) ||
    daysRemaining <= 0;
  if (invalid) {
    return { apr: NaN, returnMultiple: NaN, profitPer100: NaN, valid: false };
  }
  const returnMultiple = 1 / entryPrice - 1;
  const apr = (returnMultiple * 365) / daysRemaining;
  return {
    apr,
    returnMultiple,
    profitPer100: returnMultiple * 100,
    valid: true,
  };
}

/* ─── Normalisation helpers for Gamma responses ────────────────── */

/**
 * Gamma sometimes returns `clobTokenIds` / `outcomes` as JSON-encoded strings
 * (`"[\"id1\",\"id2\"]"`) and sometimes as arrays. Normalise to string[].
 */
export function parseStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface GammaMarketRaw {
  id?: string;
  slug?: string;
  question?: string;
  endDate?: string;
  closed?: boolean;
  clobTokenIds?: unknown;
  outcomes?: unknown;
  groupItemTitle?: string;
  description?: string;
  icon?: string;
  image?: string;
}

interface GammaEventRaw {
  id?: string;
  slug?: string;
  title?: string;
  endDate?: string;
  closed?: boolean;
  markets?: GammaMarketRaw[];
  description?: string;
  icon?: string;
  image?: string;
}

/**
 * Build an Outcome from a raw Gamma market object.
 * Assumes outcomes are ["Yes","No"] (Polymarket's binary convention).
 */
function outcomeFromMarket(m: GammaMarketRaw, parentEndDate?: string | null): Outcome {
  const tokens = parseStringArray(m.clobTokenIds);
  const outcomes = parseStringArray(m.outcomes);
  // Map the outcome label to its token id. Polymarket's CLOB convention:
  // clobTokenIds[0] corresponds to outcomes[0], etc.
  const yesIdx = outcomes.findIndex((o) => /^yes$/i.test(o));
  const noIdx = outcomes.findIndex((o) => /^no$/i.test(o));
  const yesTokenId = yesIdx >= 0 ? tokens[yesIdx] ?? null : tokens[0] ?? null;
  const noTokenId = noIdx >= 0 ? tokens[noIdx] ?? null : tokens[1] ?? null;
  return {
    id: m.id ?? m.slug ?? Math.random().toString(36).slice(2),
    title: m.groupItemTitle || m.question || "Outcome",
    question: m.question || "",
    yesTokenId,
    noTokenId,
    endDate: m.endDate ?? parentEndDate ?? null,
    closed: !!m.closed,
    description: m.description ?? null,
    icon: m.icon ?? m.image ?? null,
  };
}

export function normaliseMarket(raw: GammaMarketRaw): ResolvedMarket {
  const outcome = outcomeFromMarket(raw);
  return {
    type: "market",
    slug: raw.slug ?? "",
    title: raw.question ?? "",
    endDate: raw.endDate ?? null,
    closed: !!raw.closed,
    outcomes: [outcome],
    description: raw.description ?? null,
    icon: raw.icon ?? null,
    image: raw.image ?? null,
  };
}

export function normaliseEvent(raw: GammaEventRaw): ResolvedMarket {
  const outcomes = (raw.markets ?? []).map((m) => outcomeFromMarket(m, raw.endDate ?? null));
  return {
    type: "event",
    slug: raw.slug ?? "",
    title: raw.title ?? "",
    endDate: raw.endDate ?? null,
    closed: !!raw.closed,
    outcomes,
    description: raw.description ?? null,
    icon: raw.icon ?? null,
    image: raw.image ?? null,
  };
}

/* ─── Formatting ───────────────────────────────────────────────── */

export function formatPercent(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatDays(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1) {
    const hours = Math.round(n * 24);
    return `${hours} h`;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} días`;
}

export function formatUSDC(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)} USDC`;
}

/* ─── Data API (user positions + activity + market prices) ─────── */

export const POLYMARKET_DATA_URL =
  process.env.POLYMARKET_DATA_URL ?? "https://data-api.polymarket.com";

/**
 * Current positions for a wallet. Mirrors the shape returned by the sync
 * adapter at lib/sync/adapters/polymarket.ts (same endpoint).
 */
export interface UserPosition {
  title: string;
  outcome: string; // "Yes" | "No"
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  curPrice: number;
  conditionId: string;
  slug: string;
}

export async function fetchUserPositions(
  wallet: string,
  opts?: { signal?: AbortSignal; sizeThreshold?: number; limit?: number },
): Promise<UserPosition[]> {
  const limit = opts?.limit ?? 500;
  const threshold = opts?.sizeThreshold ?? 0;
  const url = `${POLYMARKET_DATA_URL}/positions?user=${wallet}&sizeThreshold=${threshold}&limit=${limit}`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) throw new Error(`Polymarket positions: HTTP ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error(`Polymarket positions: expected array, got ${typeof raw}`);
  }
  return raw as UserPosition[];
}

/**
 * User activity (trades, orders). Endpoint returns an array of events newest
 * first. Each event includes type, timestamp, market, price/size, and
 * transaction hash when applicable.
 */
export interface UserActivity {
  /** Type: "TRADE" | "SPLIT" | "MERGE" | ... */
  type: string;
  /** Timestamp in unix seconds or ISO string */
  timestamp: number | string;
  /** Market slug or condition id */
  market?: string;
  slug?: string;
  conditionId?: string;
  outcome?: string;    // "Yes" | "No"
  side?: string;       // "BUY" | "SELL"
  price?: number;
  size?: number;
  usdcSize?: number;
  /** Polygon tx hash if the action was on-chain */
  transactionHash?: string;
  /** Any other raw fields the API returns */
  [key: string]: unknown;
}

export async function fetchUserActivity(
  wallet: string,
  opts?: { signal?: AbortSignal; limit?: number; sinceTs?: number },
): Promise<UserActivity[]> {
  const limit = opts?.limit ?? 200;
  const params = new URLSearchParams({
    user: wallet,
    limit: String(limit),
    sortBy: "TIMESTAMP",
    sortDirection: "DESC",
  });
  const url = `${POLYMARKET_DATA_URL}/activity?${params.toString()}`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) throw new Error(`Polymarket activity: HTTP ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error(`Polymarket activity: expected array, got ${typeof raw}`);
  }
  const rows = raw as UserActivity[];
  if (opts?.sinceTs != null) {
    return rows.filter((r) => {
      const ts = typeof r.timestamp === "string"
        ? Math.floor(Date.parse(r.timestamp) / 1000)
        : Number(r.timestamp);
      return Number.isFinite(ts) && ts >= opts.sinceTs!;
    });
  }
  return rows;
}

/**
 * Current market prices (yes/no ask, volume) for a batch of sub-market slugs
 * via Gamma API. Returns a map keyed by slug.
 */
export interface MarketPriceSnapshot {
  slug: string;
  yesPrice: number | null;
  noPrice: number | null;
  volume: number | null;
  endDate: string | null;
  closed: boolean;
}

/**
 * Open limit orders resting in the CLOB for a user. Polymarket exposes this
 * under data-api too (off-chain state). Each entry has market, side, size,
 * price, and timestamps.
 */
export interface UserOpenOrder {
  market?: string;       // condition id
  slug?: string;
  outcome?: string;
  side?: string;
  price?: number;
  size?: number;
  filledSize?: number;
  remainingSize?: number;
  createdAt?: string;
  orderHash?: string;
  [key: string]: unknown;
}

export async function fetchUserOpenOrders(
  wallet: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<UserOpenOrder[]> {
  const limit = opts?.limit ?? 200;
  const url = `${POLYMARKET_DATA_URL}/orders?user=${wallet}&limit=${limit}`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) {
    if (res.status === 404) return []; // no orders endpoint or no orders
    throw new Error(`Polymarket orders: HTTP ${res.status}`);
  }
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];
  return raw as UserOpenOrder[];
}

export async function fetchMarketPrices(
  slugs: string[],
  opts?: { signal?: AbortSignal },
): Promise<Record<string, MarketPriceSnapshot>> {
  const out: Record<string, MarketPriceSnapshot> = {};
  if (slugs.length === 0) return out;

  // Gamma supports batching by slug[]= — use it.
  const params = new URLSearchParams();
  for (const s of slugs) params.append("slug", s);
  const url = `${POLYMARKET_GAMMA_URL}/markets?${params.toString()}`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) throw new Error(`Polymarket Gamma markets: HTTP ${res.status}`);
  const raw = await res.json();
  const markets = Array.isArray(raw) ? raw : [];

  for (const m of markets) {
    const slug = (m.slug as string) ?? "";
    if (!slug) continue;
    // Prices come as JSON-string arrays in Gamma responses, aligned to `outcomes`.
    const outcomes = parseStringArray(m.outcomes);
    const outcomePrices = parseStringArray(m.outcomePrices).map((s) =>
      Number(s),
    );
    const yesIdx = outcomes.findIndex((o) => /^yes$/i.test(o));
    const noIdx = outcomes.findIndex((o) => /^no$/i.test(o));
    const yesPrice =
      yesIdx >= 0 && Number.isFinite(outcomePrices[yesIdx])
        ? outcomePrices[yesIdx]
        : outcomePrices[0] ?? null;
    const noPrice =
      noIdx >= 0 && Number.isFinite(outcomePrices[noIdx])
        ? outcomePrices[noIdx]
        : outcomePrices[1] ?? null;
    out[slug] = {
      slug,
      yesPrice,
      noPrice,
      volume: typeof m.volume === "number" ? m.volume : Number(m.volume) || null,
      endDate: (m.endDate as string) ?? null,
      closed: !!m.closed,
    };
  }

  return out;
}
