import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

const TABLES = ["platforms", "strategies", "positions", "snapshots", "profiles"] as const;
const VIEWS = ["positions_enriched", "portfolio_summary"] as const;

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { supabase } = admin;

  const tables: Record<string, { rows: unknown[]; count: number }> = {};
  const views: Record<string, { rows: unknown[]; count: number }> = {};

  await Promise.all([
    ...TABLES.map(async (name) => {
      const { data, count } = await supabase
        .from(name)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);
      tables[name] = { rows: data ?? [], count: count ?? 0 };
    }),
    ...VIEWS.map(async (name) => {
      const { data, count } = await supabase
        .from(name)
        .select("*", { count: "exact" })
        .limit(100);
      views[name] = { rows: data ?? [], count: count ?? 0 };
    }),
  ]);

  return NextResponse.json({
    tables,
    views,
    env: { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—" },
  });
}
