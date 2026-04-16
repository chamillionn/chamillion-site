import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";

const KRONOS_URL =
  "https://chamillionn--kronos-predictor-kronosservice-api.modal.run";

export async function POST(request: Request) {
  // Require authenticated user (any role for now — rate limiting later)
  const ctx = await requireUser();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Forward to Modal with a generous timeout (cold start can take 60s+)
  const res = await fetch(KRONOS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `Kronos: HTTP ${res.status}`, detail: text },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
