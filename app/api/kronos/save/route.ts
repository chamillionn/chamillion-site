import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface SavePayload {
  symbol: string;
  timeframe: string;
  model?: string;
  email?: string;
  comment?: string;
  inputCandles: unknown[];
  predictedCandles: unknown[];
  inputRange: { start: string; end: string };
  predRange: { start: string; end: string };
}

export async function POST(request: Request) {
  const body = (await request.json()) as SavePayload;

  if (!body.symbol || !body.timeframe || !body.inputCandles || !body.predictedCandles) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Basic email validation if provided
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("kronos_predictions")
    .insert({
      symbol: body.symbol,
      timeframe: body.timeframe,
      model: body.model || "small",
      email: body.email || null,
      comment: body.comment || null,
      input_candles: body.inputCandles,
      predicted_candles: body.predictedCandles,
      input_range_start: body.inputRange.start,
      input_range_end: body.inputRange.end,
      pred_range_start: body.predRange.start,
      pred_range_end: body.predRange.end,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: (data as { id: string }).id });
}
