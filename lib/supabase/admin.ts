import { createClient } from "./server";
import type { Profile } from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface AdminContext {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
  profile: Profile;
}

/**
 * Verify the current session belongs to an admin user.
 * Returns the supabase client + user + profile on success, or null if unauthorized.
 *
 * Use in server actions, API routes, and layouts to avoid
 * repeating the user → profile → role check everywhere.
 */
export async function requireAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const p = profile as Profile | null;
  if (!p || p.role !== "admin") return null;

  return { supabase, user, profile: p };
}
