import { NextResponse } from "next/server";
import {
  POLYMARKET_GAMMA_URL,
  normaliseEvent,
  normaliseMarket,
  type ResolvedMarket,
} from "@/lib/polymarket-api";

/**
 * GET /api/polymarket/market?slug=<slug>
 *
 * Resolves a slug against the Gamma API. Tries /events first (multi-outcome),
 * falls back to /markets (single binary). Returns a unified ResolvedMarket.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const eventRes = await fetchJson(
      `${POLYMARKET_GAMMA_URL}/events?slug=${encodeURIComponent(slug)}`,
    );
    if (Array.isArray(eventRes) && eventRes.length > 0) {
      const resolved: ResolvedMarket = normaliseEvent(eventRes[0]);
      if (resolved.outcomes.length > 0) {
        return NextResponse.json({ market: resolved });
      }
    }

    const marketRes = await fetchJson(
      `${POLYMARKET_GAMMA_URL}/markets?slug=${encodeURIComponent(slug)}`,
    );
    if (Array.isArray(marketRes) && marketRes.length > 0) {
      const resolved: ResolvedMarket = normaliseMarket(marketRes[0]);
      return NextResponse.json({ market: resolved });
    }

    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    console.error("[polymarket market]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Upstream ${res.status}`);
  }
  return res.json();
}
