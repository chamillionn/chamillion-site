import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/supabase/auth";
import { fetchCandles, fetchCandlesByRange, type Timeframe } from "@/lib/binance";
import { fetchTwelveCandles, fetchTwelveCandlesByRange } from "@/lib/twelvedata";
import { fetchYahooCandles, fetchYahooCandlesByRange } from "@/lib/yahoo";
import { findAsset } from "@/lib/assets";
import { checkAndBumpCandlesLimit, getClientIp } from "@/lib/kronos-rate-limit";
import { isTwelveBlocked } from "@/lib/twelvedata-usage";

const ALLOWED_TFS: Timeframe[] = ["1h", "4h", "1d"];

/**
 * GET /api/kronos/candles?id=btc&tf=1h&limit=512
 *    or
 * GET /api/kronos/candles?bnb=SOLUSDT&tf=1h  (dynamic Binance premium)
 *    or
 * GET /api/kronos/candles?id=gold&tf=1h&start=1234567&end=1234567
 *
 * Dispatches to Binance (crypto) or Twelve Data (stocks/indices/forex/
 * commodities). Rejects anon requests for premium assets.
 */
export async function GET(request: Request) {
  // IP-based rate limit to protect shared provider quotas (Twelve Data free tier is 800/day, 8/min)
  const ip = getClientIp(request);
  const ipLimit = checkAndBumpCandlesLimit(ip);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Demasiadas peticiones desde tu red.", resetsAt: ipLimit.resetsAt },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const bnb = url.searchParams.get("bnb");
  const tf = url.searchParams.get("tf") as Timeframe | null;
  const limitParam = Math.min(Number(url.searchParams.get("limit") ?? 512), 1024);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!tf || !ALLOWED_TFS.includes(tf)) {
    return NextResponse.json({ error: "Invalid tf" }, { status: 400 });
  }

  let assetSymbol: string;
  let source: "binance" | "twelvedata" | "yahoo";
  let tier: "free" | "premium";
  let supportedTfs: Timeframe[] = ALLOWED_TFS;
  let responseId: string;

  if (id) {
    const asset = findAsset(id);
    if (!asset) return NextResponse.json({ error: "Unknown asset" }, { status: 404 });
    assetSymbol = asset.symbol;
    source = asset.source;
    tier = asset.tier;
    supportedTfs = asset.timeframes;
    responseId = asset.id;
  } else if (bnb) {
    // Dynamic Binance premium pair (not in the curated catalog)
    if (!/^[A-Z0-9]{2,20}USDT$/.test(bnb)) {
      return NextResponse.json({ error: "Invalid bnb symbol" }, { status: 400 });
    }
    assetSymbol = bnb;
    source = "binance";
    tier = "premium";
    responseId = `bnb-${bnb}`;
  } else {
    return NextResponse.json({ error: "Missing id or bnb" }, { status: 400 });
  }

  if (!supportedTfs.includes(tf)) {
    return NextResponse.json(
      { error: "Timeframe not supported for this asset" },
      { status: 400 },
    );
  }

  // Twelve Data cool-off — if we hit a 429 recently, fail fast
  if (source === "twelvedata") {
    const { blocked, untilTs } = isTwelveBlocked();
    if (blocked) {
      return NextResponse.json(
        {
          error: "TD_BLOCKED",
          message: "Este activo está temporalmente no disponible.",
          untilTs: new Date(untilTs).toISOString(),
        },
        { status: 503 },
      );
    }
  }

  // Tier gate — anon can only access free assets
  if (tier === "premium") {
    const ctx = await getOptionalUser();
    const isMember = !!ctx && (ctx.profile.role === "member" || ctx.profile.role === "admin");
    if (!isMember) {
      return NextResponse.json(
        { error: "Premium asset", message: "Suscríbete para acceder a este activo." },
        { status: 403 },
      );
    }
  }

  try {
    let candles;
    const hasRange = start && end;

    if (source === "binance") {
      if (hasRange) {
        candles = await fetchCandlesByRange(assetSymbol, tf, Number(start), Number(end));
      } else {
        candles = await fetchCandles(assetSymbol, tf, limitParam);
      }
    } else if (source === "yahoo") {
      if (hasRange) {
        candles = await fetchYahooCandlesByRange(assetSymbol, tf, Number(start), Number(end));
      } else {
        candles = await fetchYahooCandles(assetSymbol, tf, limitParam);
      }
    } else {
      if (hasRange) {
        candles = await fetchTwelveCandlesByRange(assetSymbol, tf, Number(start), Number(end));
      } else {
        candles = await fetchTwelveCandles(assetSymbol, tf, limitParam);
      }
    }

    return NextResponse.json({
      id: responseId,
      symbol: assetSymbol,
      source,
      candles,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    console.error("[candles proxy]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
