import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface UserContext {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
  profile: Profile;
}

/**
 * Get the current authenticated user and their profile.
 * Returns null if not logged in or profile doesn't exist.
 * Wrapped in React.cache() for request dedup.
 */
export const requireUser = cache(
  async (): Promise<UserContext | null> => {
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
    if (!p) return null;

    return { supabase, user, profile: p };
  },
);

/**
 * Require member or admin role.
 * Returns null if free or not logged in.
 */
export const requireMember = cache(
  async (): Promise<UserContext | null> => {
    const ctx = await requireUser();
    if (!ctx) return null;
    if (ctx.profile.role !== "member" && ctx.profile.role !== "admin")
      return null;
    return ctx;
  },
);

/**
 * Optional auth — returns profile if logged in, null if not.
 * Semantic alias for pages that adapt UI based on auth state.
 */
export const getOptionalUser = requireUser;
