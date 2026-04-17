import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { KronosPrediction } from "@/lib/supabase/types";
import type { Candle, Timeframe } from "@/lib/binance";
import { fetchCandlesByRange } from "@/lib/binance";
import SharedClient from "./shared-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("kronos_predictions")
    .select("symbol, timeframe, comment")
    .eq("id", id)
    .single();

  const p = data as { symbol: string; timeframe: string; comment: string | null } | null;
  if (!p) return { title: "Predicción no encontrada" };

  const asset = p.symbol.replace("USDT", "");
  const title = `Kronos — ${asset}/USDT (${p.timeframe})`;
  const description = p.comment || `Predicción de velas con Kronos para ${asset}/USDT en timeframe ${p.timeframe}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedPredictionPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("kronos_predictions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const prediction = data as KronosPrediction;
  const inputCandles = prediction.input_candles as Candle[];
  const predictedCandles = prediction.predicted_candles as Candle[];

  // Fetch actual candles from Binance for the prediction range
  let actualCandles: Candle[] = [];
  if (prediction.pred_range_start && prediction.pred_range_end && predictedCandles.length > 0) {
    const startMs = new Date(prediction.pred_range_start).getTime();
    const endMs = new Date(prediction.pred_range_end).getTime();
    // Only fetch if the prediction period has started
    if (Date.now() > startMs) {
      try {
        actualCandles = await fetchCandlesByRange(
          prediction.symbol,
          prediction.timeframe as Timeframe,
          startMs,
          endMs,
        );
      } catch {
        // If Binance fails, continue without actual data
        actualCandles = [];
      }
    }
  }

  return (
    <SharedClient
      prediction={{
        id: prediction.id,
        symbol: prediction.symbol,
        timeframe: prediction.timeframe as Timeframe,
        model: prediction.model || "small",
        comment: prediction.comment,
        createdAt: prediction.created_at,
      }}
      inputCandles={inputCandles}
      predictedCandles={predictedCandles}
      actualCandles={actualCandles}
    />
  );
}
