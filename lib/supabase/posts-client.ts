import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Supabase client that always connects to the production database for posts.
 * In dev, SUPABASE_PROD_* vars point to prod while the rest of the app uses chamillion-dev.
 * In prod, falls back to the standard vars (same database).
 * Uses service role key to bypass RLS (dev auth tokens aren't valid against prod RLS).
 */
export function createPostsClient() {
  const url =
    process.env.PROD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
