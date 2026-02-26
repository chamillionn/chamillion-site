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
 *  1. Bearer token (SYNC_SECRET for manual calls, CRON_SECRET for Vercel Cron)
 *  2. Valid admin Supabase session (for admin panel calls)
 */
export async function authCheck(request: Request): Promise<boolean> {
  // 1. Check Bearer token (SYNC_SECRET or Vercel CRON_SECRET)
  const auth = request.headers.get("authorization");
  const syncSecret = process.env.SYNC_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  if (syncSecret && auth === `Bearer ${syncSecret}`) return true;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

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
