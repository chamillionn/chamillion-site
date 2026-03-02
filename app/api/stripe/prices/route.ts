import { NextResponse } from "next/server";
import { getActivePrices } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/prices
 * Returns active prices for the membership product.
 */
export async function GET() {
  try {
    const prices = await getActivePrices();

    const formatted = prices.map((p) => ({
      id: p.id,
      name: p.product_name,
      unitAmount: p.unit_amount,
      currency: p.currency,
      interval: p.recurring?.interval ?? null,
      intervalCount: p.recurring?.interval_count ?? null,
    }));

    return NextResponse.json(formatted, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/prices] Error fetching prices:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
