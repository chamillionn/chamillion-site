import { requireAdmin } from "@/lib/supabase/admin";

export interface SyncResult {
  platform: string;
  updated: number;
  deactivated: number;
  errors: string[];
  timestamp: string;
}

/** Common position format produced by platform adapters */
export interface PositionRow {
  asset: string;
  size: number;
  cost_basis: number;
  current_value: number;
  notes: string;
}

/** Each platform implements fetch + transform only */
export interface PlatformAdapter {
  /** Must match the `name` column in the `platforms` DB table */
  platformName: string;
  fetchPositions(wallet: string): Promise<{
    positions: PositionRow[];
    warnings: string[];
  }>;
}

/**
 * Auth check for sync routes.
 * Accepts either:
 *  1. Bearer token (SYNC_SECRET for GitHub Actions cron / manual calls)
 *  2. Valid admin Supabase session (for admin panel calls)
 */
export async function authCheck(request: Request): Promise<boolean> {
  // 1. Check Bearer token
  const auth = request.headers.get("authorization");
  const secret = process.env.SYNC_SECRET;
  if (secret && auth === `Bearer ${secret}`) return true;

  // 2. Check Supabase session (admin role)
  try {
    return (await requireAdmin()) !== null;
  } catch {
    return false;
  }
}
