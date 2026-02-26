import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authCheck, type SyncResult } from "@/lib/sync/types";

const HL_API = "https://api.hyperliquid.xyz/info";

interface HLPosition {
  type: string;
  position: {
    coin: string;
    szi: string;
    entryPx: string;
    positionValue: string;
    unrealizedPnl: string;
    marginUsed: string;
  };
}

interface HLSpotBalance {
  coin: string;
  total: string;
  hold: string;
  entryNtl: string;
}

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: SyncResult = {
    platform: "Hyperliquid",
    updated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  const supabase = await createClient();

  // Get the Hyperliquid platform + wallet address from DB
  const { data: platforms } = await (supabase.from("platforms") as ReturnType<typeof supabase.from>)
    .select("id, wallet_address")
    .eq("name", "Hyperliquid")
    .limit(1);
  const platform = (platforms as { id: string; wallet_address: string | null }[] | null)?.[0];

  if (!platform?.wallet_address) {
    return NextResponse.json(
      { ...result, errors: ["Hyperliquid no tiene wallet address configurada. Edítala en Admin > Plataformas."] },
    );
  }

  const wallet = platform.wallet_address;
  const platformId = platform.id;

  // Fetch existing active positions for this platform
  const { data: existingRows } = await (supabase.from("positions") as ReturnType<typeof supabase.from>)
    .select("id, asset")
    .eq("platform_id", platformId)
    .eq("is_active", true);
  const existingMap = new Map(
    (existingRows as { id: string; asset: string }[] ?? []).map((r) => [r.asset, r.id]),
  );

  const syncedAssets = new Set<string>();

  // 1. Fetch perp positions
  try {
    const perpRes = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: wallet }),
    });
    const perpData = await perpRes.json();

    if (perpData.assetPositions) {
      for (const ap of perpData.assetPositions as HLPosition[]) {
        const p = ap.position;
        const size = parseFloat(p.szi);
        if (size === 0) continue;

        const currentValue = parseFloat(p.positionValue);
        const entryValue = Math.abs(size) * parseFloat(p.entryPx);
        const asset = `${p.coin} Perp`;
        syncedAssets.add(asset);

        const row = {
          size: Math.abs(size),
          cost_basis: entryValue,
          current_value: currentValue,
          is_active: true,
          notes: `${size > 0 ? "Long" : "Short"} | Margin: $${parseFloat(p.marginUsed).toFixed(2)} | uPnL: $${parseFloat(p.unrealizedPnl).toFixed(2)}`,
        };

        const existingId = existingMap.get(asset);
        const { error } = existingId
          ? await (supabase.from("positions") as ReturnType<typeof supabase.from>)
              .update(row)
              .eq("id", existingId)
          : await (supabase.from("positions") as ReturnType<typeof supabase.from>)
              .insert({ ...row, asset, platform_id: platformId, opened_at: new Date().toISOString() });

        if (error) {
          result.errors.push(`Perp ${p.coin}: ${error.message}`);
        } else {
          result.updated++;
        }
      }
    }
  } catch (e) {
    result.errors.push(`Perps fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Fetch spot balances
  try {
    const spotRes = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "spotClearinghouseState", user: wallet }),
    });
    const spotData = await spotRes.json();

    if (spotData.balances) {
      for (const b of spotData.balances as HLSpotBalance[]) {
        const total = parseFloat(b.total);
        if (total === 0) continue;
        if (b.coin === "USDC") continue;

        const asset = `${b.coin} Spot`;
        const entryNtl = parseFloat(b.entryNtl) || 0;
        syncedAssets.add(asset);

        const row = {
          size: total,
          cost_basis: entryNtl,
          current_value: entryNtl,
          is_active: true,
          notes: `Spot balance | Hold: ${b.hold}`,
        };

        const existingId = existingMap.get(asset);
        const { error } = existingId
          ? await (supabase.from("positions") as ReturnType<typeof supabase.from>)
              .update(row)
              .eq("id", existingId)
          : await (supabase.from("positions") as ReturnType<typeof supabase.from>)
              .insert({ ...row, asset, platform_id: platformId, opened_at: new Date().toISOString() });

        if (error) {
          result.errors.push(`Spot ${b.coin}: ${error.message}`);
        } else {
          result.updated++;
        }
      }
    }
  } catch (e) {
    result.errors.push(`Spot fetch: ${e instanceof Error ? e.message : String(e)}`);
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

  return NextResponse.json(result);
}
