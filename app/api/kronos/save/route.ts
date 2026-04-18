import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  checkAndBumpSaveLimit,
  getClientIp,
  sanitizeComment,
  validateSaveInput,
} from "@/lib/kronos-rate-limit";

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
  // IP rate limit first (cheap)
  const ip = getClientIp(request);
  const limit = checkAndBumpSaveLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Demasiados guardados desde tu red. Vuelve a intentarlo más tarde.", resetsAt: limit.resetsAt },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as SavePayload | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const validation = validateSaveInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Basic email validation if provided
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const cleanComment = sanitizeComment(body.comment);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("kronos_predictions")
    .insert({
      symbol: body.symbol,
      timeframe: body.timeframe,
      model: body.model || "small",
      email: body.email || null,
      comment: cleanComment,
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
