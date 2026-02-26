import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authCheck, type SyncResult } from "@/lib/sync/types";

const POLY_API = "https://data-api.polymarket.com/positions";

interface PolyPosition {
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  curPrice: number;
  conditionId: string;
  slug: string;
}

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: SyncResult = {
    platform: "Polymarket",
    updated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  const supabase = createServiceClient();

  // Get the Polymarket platform + wallet address from DB
  const { data: platforms } = await (supabase.from("platforms") as ReturnType<typeof supabase.from>)
    .select("id, wallet_address")
    .eq("name", "Polymarket")
    .limit(1);
  const platform = (platforms as { id: string; wallet_address: string | null }[] | null)?.[0];

  if (!platform?.wallet_address) {
    return NextResponse.json(
      { ...result, errors: ["Polymarket no tiene wallet address configurada. Edítala en Admin > Plataformas."] },
    );
  }

  const wallet = platform.wallet_address;
  const platformId = platform.id;

  try {
    const url = `${POLY_API}?user=${wallet}&sizeThreshold=0&limit=500`;
    const res = await fetch(url);
    const positions = (await res.json()) as PolyPosition[];

    // Fetch existing active positions for this platform
    const { data: existingRows } = await (supabase.from("positions") as ReturnType<typeof supabase.from>)
      .select("id, asset")
      .eq("platform_id", platformId)
      .eq("is_active", true);
    const existingMap = new Map(
      (existingRows as { id: string; asset: string }[] ?? []).map((r) => [r.asset, r.id]),
    );

    const syncedAssets = new Set<string>();

    for (const p of positions) {
      if (p.size === 0) continue;

      const shortTitle = p.title.length > 60 ? p.title.slice(0, 57) + "..." : p.title;
      const asset = `${shortTitle} (${p.outcome})`;
      syncedAssets.add(asset);

      const row = {
        size: p.size,
        cost_basis: p.initialValue,
        current_value: p.currentValue,
        is_active: true,
        notes: `${p.outcome} @ ${(p.curPrice * 100).toFixed(0)}¢ | Avg: ${(p.avgPrice * 100).toFixed(0)}¢ | PnL: $${p.cashPnl.toFixed(2)} (${p.percentPnl.toFixed(1)}%)`,
      };

      const existingId = existingMap.get(asset);
      const { error } = existingId
        ? await (supabase.from("positions") as ReturnType<typeof supabase.from>)
            .update(row)
            .eq("id", existingId)
        : await (supabase.from("positions") as ReturnType<typeof supabase.from>)
            .insert({ ...row, asset, platform_id: platformId, opened_at: new Date().toISOString() });

      if (error) {
        result.errors.push(`${shortTitle}: ${error.message}`);
      } else {
        result.updated++;
      }
    }

    // Deactivate positions no longer returned by API
    const staleIds = [...existingMap.entries()]
      .filter(([asset]) => !syncedAssets.has(asset))
      .map(([, id]) => id);

    if (staleIds.length > 0) {
      await (supabase.from("positions") as ReturnType<typeof supabase.from>)
        .update({ is_active: false, closed_at: new Date().toISOString() })
        .in("id", staleIds);
    }
  } catch (e) {
    result.errors.push(`Fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json(result);
}
