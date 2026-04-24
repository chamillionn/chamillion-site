import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  getAnalysisForAdmin,
  listObservations,
  latestSnapshot,
  listEvents,
} from "@/lib/supabase/analyses-client";
import ObservationsPanel from "../observations-panel";
import TrackerPanel from "../tracker-panel";
import crud from "../../crud.module.css";

export const metadata = { title: "Admin — Análisis" };

export default async function AnalysisAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const { slug } = await params;
  const analysis = await getAnalysisForAdmin(slug, admin.dataClient);
  if (!analysis) notFound();

  const [observations, snapshot, events] = analysis.has_prediction
    ? await Promise.all([
        listObservations(analysis.id, admin.dataClient),
        latestSnapshot(analysis.id, admin.dataClient),
        listEvents(analysis.id, admin.dataClient, 50),
      ])
    : [[], null, []];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}>
        <Link
          href="/admin/analisis"
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 12,
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          ← Todos los análisis
        </Link>
      </div>

      <h1 className={crud.heading}>{analysis.title}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          padding: 18,
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--bg-card)",
          marginBottom: 24,
        }}
      >
        <Meta label="Slug" value={analysis.slug} mono />
        <Meta label="Activo" value={analysis.asset ?? "—"} />
        <Meta label="Sección" value={analysis.section ?? "—"} />
        <Meta
          label="Visibilidad"
          value={
            analysis.visibility === "public"
              ? "Público"
              : analysis.visibility === "premium"
                ? "Premium"
                : "Privado"
          }
        />
        <Meta
          label="Publicado"
          value={
            analysis.published_at
              ? new Date(analysis.published_at).toLocaleDateString("es-ES")
              : "—"
          }
        />
        {analysis.has_prediction && (
          <>
            <Meta label="Activo seguido" value={analysis.prediction_asset ?? "—"} mono />
            <Meta label="Dirección" value={analysis.prediction_direction ?? "—"} />
            <Meta
              label="Baseline"
              value={
                analysis.prediction_baseline_value != null
                  ? `${analysis.prediction_baseline_value} ${analysis.prediction_unit ?? ""}`
                  : "—"
              }
            />
            <Meta
              label="Target"
              value={
                analysis.prediction_target_value != null
                  ? `${analysis.prediction_target_value} ${analysis.prediction_unit ?? ""}`
                  : "—"
              }
            />
            <Meta
              label="Horizonte"
              value={
                analysis.prediction_end_date
                  ? `${analysis.prediction_start_date} → ${analysis.prediction_end_date}`
                  : "—"
              }
            />
          </>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 18,
          padding: "10px 14px",
          background: "rgba(var(--steel-blue-rgb), 0.04)",
          border: "1px solid var(--border)",
          borderRadius: 8,
        }}
      >
        La metadata anterior se sincroniza desde el código (
        <code style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
          app/analisis/registry.ts
        </code>
        ). Para editarla, pídele a Claude que actualice la entrada correspondiente.
      </div>

      <TrackerPanel analysis={analysis} latest={snapshot} events={events} />

      <ObservationsPanel analysis={analysis} observations={observations} />
    </div>
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 9,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono
            ? "var(--font-dm-mono), monospace"
            : "var(--font-outfit), sans-serif",
          fontSize: mono ? 12 : 14,
          color: "var(--text-primary)",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}
