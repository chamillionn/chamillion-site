import { createClient } from "@/lib/supabase/server";

export interface SyncResult {
  platform: string;
  updated: number;
  errors: string[];
  timestamp: string;
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    return profile?.role === "admin";
  } catch {
    return false;
  }
}
