import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { listAdminAnalyses } from "@/lib/supabase/analyses-client";
import AnalysesTable from "./analyses-table";

export const metadata = { title: "Admin — Análisis" };

export default async function AdminAnalisis() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const analyses = await listAdminAnalyses();
  return <AnalysesTable analyses={analyses} />;
}
