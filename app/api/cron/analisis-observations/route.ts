import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { createAnalysesClient } from "@/lib/supabase/analyses-client";
import { fetchCandles } from "@/lib/binance";

interface Result {
  analysis_id: string;
  symbol: string;
  status: "inserted" | "skipped" | "error";
  error?: string;
}

/**
 * Cron endpoint: pulls the latest daily close from Binance for every analysis
 * whose prediction is sourced from Binance. Dedupes via the unique index on
 * (analysis_id, source, date_trunc('day', observed_at)).
 */
export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAnalysesClient();
  const { data, error } = await db
    .from("analyses")
    .select("id,prediction_asset,prediction_source,has_prediction")
    .eq("has_prediction", true)
    .eq("prediction_source", "binance");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const results: Result[] = [];

  for (const row of rows) {
    const symbol = (row.prediction_asset || "").toUpperCase().trim();
    if (!symbol) {
      results.push({ analysis_id: row.id, symbol: "", status: "error", error: "empty symbol" });
      continue;
    }
    try {
      const candles = await fetchCandles(symbol, "1d", 1);
      if (!candles.length) {
        results.push({ analysis_id: row.id, symbol, status: "error", error: "no candles" });
        continue;
      }
      const c = candles[0];
      const { error: insertError } = await db.from("analysis_observations").insert({
        analysis_id: row.id,
        observed_at: new Date(c.time * 1000).toISOString(),
        value: c.close,
        source: "binance",
        note: null,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          results.push({ analysis_id: row.id, symbol, status: "skipped" });
        } else {
          results.push({ analysis_id: row.id, symbol, status: "error", error: insertError.message });
        }
        continue;
      }
      results.push({ analysis_id: row.id, symbol, status: "inserted" });
    } catch (e) {
      results.push({
        analysis_id: row.id,
        symbol,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const counts = {
    inserted: results.filter((r) => r.status === "inserted").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({
    processed: results.length,
    ...counts,
    results,
  });
}
