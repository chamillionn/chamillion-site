import { createServiceClient } from "@/lib/supabase/server";
import type { PlatformAdapter, SyncResult } from "./types";
import { validatePositionRow } from "./validate";

/**
 * Sync positions for a single platform.
 * Handles all DB operations: lookup, insert/update, stale deactivation.
 * The adapter only provides fetch + transform logic.
 */
export async function syncPlatform(adapter: PlatformAdapter): Promise<SyncResult> {
  const result: SyncResult = {
    platform: adapter.platformName,
    updated: 0,
    deactivated: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  const supabase = createServiceClient();

  // 1. Get platform row + wallet from DB
  const { data: platforms } = await (supabase.from("platforms") as ReturnType<typeof supabase.from>)
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
  const { data: existingRows } = await (supabase.from("positions") as ReturnType<typeof supabase.from>)
    .select("id, asset")
    .eq("platform_id", platformId)
    .eq("is_active", true);

  const existingMap = new Map(
    (existingRows as { id: string; asset: string }[] ?? []).map((r) => [r.asset, r.id]),
  );

  // 3. Fetch positions from external API via adapter
  let positions: Awaited<ReturnType<PlatformAdapter["fetchPositions"]>>["positions"];
  let warnings: string[];
  try {
    ({ positions, warnings } = await adapter.fetchPositions(wallet));
    result.errors.push(...warnings);
  } catch (e) {
    result.errors.push(`Fetch: ${e instanceof Error ? e.message : String(e)}`);
    return result;
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
      cost_basis: pos.cost_basis,
      current_value: pos.current_value,
      is_active: true,
      notes: pos.notes,
    };

    const existingId = existingMap.get(pos.asset);
    const { error } = existingId
      ? await (supabase.from("positions") as ReturnType<typeof supabase.from>)
          .update(row)
          .eq("id", existingId)
      : await (supabase.from("positions") as ReturnType<typeof supabase.from>)
          .insert({ ...row, asset: pos.asset, platform_id: platformId, opened_at: new Date().toISOString() });

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
    const { error: deactivateErr } = await (supabase.from("positions") as ReturnType<typeof supabase.from>)
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
