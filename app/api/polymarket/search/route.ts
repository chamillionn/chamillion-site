import { NextResponse } from "next/server";
import { POLYMARKET_GAMMA_URL, type SearchResult } from "@/lib/polymarket-api";

/**
 * GET /api/polymarket/search?q=<query>
 *
 * Uses Polymarket's official public-search endpoint — the same fuzzy search
 * that powers the polymarket.com autocomplete. Handles typos and partial
 * matches much better than /markets?search=.
 *
 * Response shape: { events, tags, profiles }. We only surface events (each
 * event is either a single binary market or a multi-outcome group, and the
 * /market/[slug] resolver handles both).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const target = new URL(`${POLYMARKET_GAMMA_URL}/public-search`);
  target.searchParams.set("q", q);
  target.searchParams.set("limit_per_type", "10");
  target.searchParams.set("events_status", "active");

  try {
    const res = await fetch(target.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: res.status },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as {
      events?: Array<{
        slug?: string;
        title?: string;
        ticker?: string;
        endDate?: string;
        closed?: boolean;
        icon?: string;
        image?: string;
        volume?: string | number;
        volume24hr?: string | number;
      }>;
    };
    const events = Array.isArray(raw.events) ? raw.events : [];
    const results: SearchResult[] = events
      .filter((e) => e.slug && (e.title || e.ticker))
      .map((e) => ({
        slug: e.slug!,
        question: e.title || e.ticker || "",
        endDate: e.endDate ?? null,
        closed: !!e.closed,
        volume: numberOrUndefined(e.volume24hr) ?? numberOrUndefined(e.volume),
        icon: e.icon || e.image || null,
      }));
    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    console.error("[polymarket search]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

function numberOrUndefined(v: string | number | undefined): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
