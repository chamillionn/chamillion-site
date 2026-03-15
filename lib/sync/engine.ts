import { createServiceClient } from "@/lib/supabase/server";
import type { PlatformAdapter, SyncResult } from "./types";
import { validatePositionRow } from "./validate";
import { resolveEurUsdRate, usdToEur } from "./forex";

/**
 * Sync positions for a single platform.
 * Handles all DB operations: lookup, insert/update, stale deactivation.
 * The adapter only provides fetch + transform logic.
 *
 * @param eurUsdRate - Optional pre-fetched rate (avoids multiple ECB calls in sync-all).
 *                     If omitted, the rate is fetched internally.
 */
export async function syncPlatform(adapter: PlatformAdapter, eurUsdRate?: number): Promise<SyncResult> {
  const result: SyncResult = {
    platform: adapter.platformName,
    updated: 0,
    deactivated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  const supabase = createServiceClient();

  // 0. Resolve EUR/USD rate (APIs return USD, DB stores EUR)
  let rate = eurUsdRate;
  if (!rate) {
    const resolved = await resolveEurUsdRate(supabase);
    rate = resolved.rate;
  }

  // 1. Get platform row + wallet from DB
  const { data: platforms } = await supabase.from("platforms")
    .select("id, wallet_address")
    .eq("name", adapter.platformName)
    .limit(1);

  const platform = (platforms as { id: string; wallet_address: string | null }[] | null)?.[0];

  if (!platform?.wallet_address) {
    result.errors.push(
      `${adapter.platformName} no tiene wallet address configurada. Edítala en Admin > Plataformas.`,
    );
    return result;
  }

  const { id: platformId, wallet_address: wallet } = platform;

  // 2. Fetch existing active positions for diff
  const { data: existingRows } = await supabase.from("positions")
    .select("id, asset")
    .eq("platform_id", platformId)
    .eq("is_active", true);

  const existingMap = new Map(
    (existingRows as { id: string; asset: string }[] ?? []).map((r) => [r.asset, r.id]),
  );

  // 3. Fetch positions from external API via adapter (30s timeout)
  let positions: Awaited<ReturnType<PlatformAdapter["fetchPositions"]>>["positions"];
  let warnings: string[];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  try {
    ({ positions, warnings } = await adapter.fetchPositions(wallet, controller.signal));
    result.errors.push(...warnings);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(controller.signal.aborted ? `Fetch timeout (30s): ${adapter.platformName}` : `Fetch: ${msg}`);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. Upsert each position (validate before DB write)
  const syncedAssets = new Set<string>();

  for (const pos of positions) {
    const validationError = validatePositionRow(pos);
    if (validationError) {
      result.errors.push(validationError);
      continue;
    }

    syncedAssets.add(pos.asset);

    const row = {
      size: pos.size,
      cost_basis: usdToEur(pos.cost_basis, rate),
      current_value: usdToEur(pos.current_value, rate),
      is_active: true,
      notes: pos.notes,
    };

    const existingId = existingMap.get(pos.asset);
    const { error } = existingId
      ? await supabase.from("positions")
          .update(row)
          .eq("id", existingId)
      : await supabase.from("positions")
          .upsert(
            { ...row, asset: pos.asset, platform_id: platformId, is_active: true, opened_at: new Date().toISOString() },
            { onConflict: "asset,platform_id" },
          );

    if (error) {
      result.errors.push(`${pos.asset}: ${error.message}`);
    } else {
      result.updated++;
    }
  }

  // 5. Deactivate stale positions (no longer returned by API)
  const staleIds = [...existingMap.entries()]
    .filter(([asset]) => !syncedAssets.has(asset))
    .map(([, id]) => id);

  if (staleIds.length > 0) {
    const { error: deactivateErr } = await supabase.from("positions")
      .update({ is_active: false, closed_at: new Date().toISOString() })
      .in("id", staleIds);

    if (deactivateErr) {
      result.errors.push(`Deactivate stale: ${deactivateErr.message}`);
    } else {
      result.deactivated = staleIds.length;
    }
  }

  return result;
}
