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
  // 1. Check Bearer token (timing-safe comparison to prevent timing attacks)
  const auth = request.headers.get("authorization");
  const secret = process.env.SYNC_SECRET;
  if (secret && auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    if (token.length === secret.length) {
      const a = new TextEncoder().encode(token);
      const b = new TextEncoder().encode(secret);
      // Constant-time comparison: always compare all bytes
      let mismatch = 0;
      for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
      if (mismatch === 0) return true;
    }
  }

  // 2. Check Supabase session (admin role)
  try {
    return (await requireAdmin()) !== null;
  } catch {
    return false;
  }
}
