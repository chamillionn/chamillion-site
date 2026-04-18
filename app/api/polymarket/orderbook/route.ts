import { NextResponse } from "next/server";
import { POLYMARKET_CLOB_URL, type Orderbook } from "@/lib/polymarket-api";

/**
 * GET /api/polymarket/orderbook?token=<token_id>
 *
 * Proxy to CLOB /book?token_id=. Returns parsed numeric levels.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const target = `${POLYMARKET_CLOB_URL}/book?token_id=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(target, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: res.status },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as {
      bids?: Array<{ price?: string | number; size?: string | number }>;
      asks?: Array<{ price?: string | number; size?: string | number }>;
    };
    const parseLevels = (
      levels: Array<{ price?: string | number; size?: string | number }> | undefined,
    ) =>
      (levels ?? [])
        .map((l) => ({
          price: Number(l.price),
          size: Number(l.size),
        }))
        .filter((l) => Number.isFinite(l.price) && Number.isFinite(l.size));

    // Sort asks ascending (best = lowest), bids descending (best = highest).
    const asks = parseLevels(raw.asks).sort((a, b) => a.price - b.price);
    const bids = parseLevels(raw.bids).sort((a, b) => b.price - a.price);

    const book: Orderbook = { bids, asks };
    return NextResponse.json({ orderbook: book });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    console.error("[polymarket orderbook]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
