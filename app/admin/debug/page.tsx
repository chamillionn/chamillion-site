import { createClient } from "@/lib/supabase/server";
import DebugView from "./debug-view";

const TABLES = ["platforms", "strategies", "positions", "snapshots", "profiles"] as const;
const VIEWS = ["positions_enriched", "portfolio_summary"] as const;

export default async function DebugPage() {
  const supabase = await createClient();

  const tables: Record<string, { rows: Record<string, unknown>[]; count: number }> = {};
  const views: Record<string, { rows: Record<string, unknown>[]; count: number }> = {};

  await Promise.all([
    ...TABLES.map(async (name) => {
      const { data, count } = await supabase
        .from(name)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);
      tables[name] = {
        rows: (data ?? []) as Record<string, unknown>[],
        count: count ?? 0,
      };
    }),
    ...VIEWS.map(async (name) => {
      const { data, count } = await supabase
        .from(name)
        .select("*", { count: "exact" })
        .limit(100);
      views[name] = {
        rows: (data ?? []) as Record<string, unknown>[],
        count: count ?? 0,
      };
    }),
  ]);

  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—",
    isDev: !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("hpyyuftotmpnzogaykgh"),
  };

  return <DebugView tables={tables} views={views} env={env} />;
}
