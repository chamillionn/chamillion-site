import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

const TABLES = ["platforms", "strategies", "positions", "snapshots", "profiles"];
const VIEWS = ["positions_enriched", "portfolio_summary"];

const PROD_URL = "https://hpyyuftotmpnzogaykgh.supabase.co";
const PROD_ANON = "sb_publishable_FTzv3vrmSUs2cmK4shqYvA_u4bT97H9";

export async function GET(request: Request) {
  // Auth check: only admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");

  // Choose which client to query
  const db = target === "prod"
    ? createBrowserClient(PROD_URL, PROD_ANON)
    : supabase;

  const tables: Record<string, { rows: unknown[]; count: number }> = {};
  const views: Record<string, { rows: unknown[]; count: number }> = {};

  await Promise.all([
    ...TABLES.map(async (name) => {
      const { data, count } = await db
        .from(name)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);
      tables[name] = { rows: data ?? [], count: count ?? 0 };
    }),
    ...VIEWS.map(async (name) => {
      const { data, count } = await db
        .from(name)
        .select("*", { count: "exact" })
        .limit(100);
      views[name] = { rows: data ?? [], count: count ?? 0 };
    }),
  ]);

  const url = target === "prod" ? PROD_URL : (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—");

  return NextResponse.json({ tables, views, env: { supabaseUrl: url, isDev: target !== "prod" } });
}
