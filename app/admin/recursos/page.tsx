import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceClient } from "@/lib/supabase/server";
import RecursosClient from "./recursos-client";

export default async function RecursosPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const supabase = createServiceClient();

  // Fetch table row counts for Supabase usage overview
  const tables = ["profiles", "positions", "trades", "snapshots", "capital_flows", "posts", "software", "software_versions", "downloads", "consultations", "consultation_types", "email_preferences", "pending_logins"] as const;

  const counts: Record<string, number> = {};
  await Promise.all(
    tables.map(async (table) => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      counts[table] = count ?? 0;
    }),
  );

  // Total rows
  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

  // Kronos kill switch
  const { data: kronosFlag } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "kronos_enabled")
    .maybeSingle();
  const kronosEnabled = kronosFlag?.value !== false;

  return (
    <RecursosClient
      dbCounts={counts}
      totalRows={totalRows}
      kronosEnabled={kronosEnabled}
    />
  );
}
