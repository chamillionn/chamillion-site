import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const COOKIE_NAME = "admin-db-target";

const NATIVE_IS_PROD =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("hpyyuftotmpnzogaykgh") ??
  false;

export type DbTarget = "dev" | "prod";

export function nativeTarget(): DbTarget {
  return NATIVE_IS_PROD ? "prod" : "dev";
}

export async function getAdminDbTarget(): Promise<DbTarget> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (raw === "dev" || raw === "prod") return raw;
  return nativeTarget();
}

export async function isViewingRemoteDb(): Promise<boolean> {
  const target = await getAdminDbTarget();
  return target !== nativeTarget();
}

/**
 * Service-role Supabase client for the selected target DB.
 * Bypasses RLS — admin-only.
 */
export async function createTargetClient() {
  const target = await getAdminDbTarget();

  let url: string;
  let key: string;

  if (target === nativeTarget()) {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  } else {
    // Viewing the "other" DB
    url = process.env.PROD_SUPABASE_URL!;
    key = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!;
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
