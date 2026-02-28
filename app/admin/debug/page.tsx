import { requireAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DebugView from "./debug-view";

const TABLES = ["platforms", "strategies", "positions", "snapshots", "profiles", "capital_flows", "posts", "site_settings"] as const;
const VIEWS = ["positions_enriched", "portfolio_summary"] as const;

export default async function DebugPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const supabase = admin.dataClient;

  const tables: Record<string, { rows: Record<string, unknown>[]; count: number }> = {};
  const views: Record<string, { rows: Record<string, unknown>[]; count: number }> = {};

  await Promise.all([
    ...TABLES.map(async (name) => {
      const { data, count } = await supabase
        .from(name)
        .select("*", { count: "exact" })
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

  const targetUrl = admin.dbTarget === "prod"
    ? (process.env.PROD_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—")
    : (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—");
  const env = {
    supabaseUrl: targetUrl,
    isDev: admin.dbTarget === "dev",
  };

  return <DebugView tables={tables} views={views} env={env} />;
}
