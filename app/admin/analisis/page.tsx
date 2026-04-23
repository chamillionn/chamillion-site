import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { listAdminAnalyses } from "@/lib/supabase/analyses-client";
import { ANALYSIS_REGISTRY } from "@/app/analisis/registry";
import { reconcileRegistry } from "./reconcile";
import AnalysesTable from "./analyses-table";

export const metadata = { title: "Admin — Análisis" };
export const dynamic = "force-dynamic";

export default async function AdminAnalisis() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  // Reconcile the code registry with the DB on every load.
  // Pure function (no revalidation) — safe to call during render.
  const syncResult = await reconcileRegistry(admin.dataClient);

  // Read from the same target the admin selected (dev/prod toggle).
  const analyses = await listAdminAnalyses(admin.dataClient);
  const registrySlugs = new Set(ANALYSIS_REGISTRY.map((e) => e.slug));

  return (
    <AnalysesTable
      analyses={analyses}
      registrySlugs={Array.from(registrySlugs)}
      syncError={syncResult.error}
    />
  );
}
