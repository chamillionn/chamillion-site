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
