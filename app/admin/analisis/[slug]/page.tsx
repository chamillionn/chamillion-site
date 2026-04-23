import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  getAnalysisForAdmin,
  listObservations,
} from "@/lib/supabase/analyses-client";
import AnalysisForm from "../analysis-form";
import ObservationsPanel from "../observations-panel";

export const metadata = { title: "Admin — Editar análisis" };

export default async function EditAnalysis({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { slug } = await params;
  const analysis = await getAnalysisForAdmin(slug);
  if (!analysis) notFound();

  const observations = analysis.has_prediction
    ? await listObservations(analysis.id)
    : [];

  return (
    <>
      <AnalysisForm mode="edit" initial={analysis} />
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <ObservationsPanel analysis={analysis} observations={observations} />
      </div>
    </>
  );
}
