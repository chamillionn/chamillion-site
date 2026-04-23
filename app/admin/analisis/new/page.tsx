import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import AnalysisForm from "../analysis-form";

export const metadata = { title: "Admin — Nuevo análisis" };

export default async function NewAnalysis() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  return <AnalysisForm mode="create" />;
}
