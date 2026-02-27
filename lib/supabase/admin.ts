import { cache } from "react";
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
 * Wrapped in React.cache() to deduplicate within a single request —
 * if both layout and page call requireAdmin(), only one DB round-trip happens.
 * Each server action gets its own scope so auth is always verified independently.
 */
export const requireAdmin = cache(
  async (): Promise<AdminContext | null> => {
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
  },
);
