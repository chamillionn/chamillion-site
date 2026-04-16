import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * When DB_ENV=prod, server-side clients use production credentials
 * even in `next dev`. Auth (createClient) always uses the default
 * env since user sessions are per-database.
 */
const isProdDb = process.env.DB_ENV === "prod";

function getDbUrl(): string {
  if (isProdDb && process.env.PROD_SUPABASE_URL) return process.env.PROD_SUPABASE_URL;
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function getAnonKey(): string {
  if (isProdDb && process.env.PROD_SUPABASE_ANON_KEY) return process.env.PROD_SUPABASE_ANON_KEY;
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

function getServiceKey(): string | undefined {
  if (isProdDb && process.env.PROD_SUPABASE_SERVICE_ROLE_KEY) return process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getDbUrl(),
    getAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Component — ignore.
            // The middleware will refresh the session anyway.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for backend operations (sync, cron).
 * Bypasses RLS — only use in trusted server-side code.
 */
export function createServiceClient() {
  const url = getDbUrl();
  const key = getServiceKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase URL or SERVICE_ROLE_KEY. " +
        "Service-role client cannot be created without both env vars.",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
