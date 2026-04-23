"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  Analysis,
  AnalysisVisibility,
  PredictionDirection,
  PredictionSource,
} from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { createAnalysis, updateAnalysis } from "./actions";
import crud from "../crud.module.css";
import styles from "./analisis.module.css";

const VISIBILITIES: { value: AnalysisVisibility; title: string; hint: string }[] = [
  { value: "public", title: "Público", hint: "Visible en /analisis para cualquiera" },
  { value: "premium", title: "Premium", hint: "Paywall — sólo miembros del hub" },
  { value: "hidden", title: "Oculto", hint: "Sólo admin — 404 para el resto" },
];

type Mode = "create" | "edit";

export default function AnalysisForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: Analysis;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [asset, setAsset] = useState(initial?.asset ?? "");
  const [thesis, setThesis] = useState(initial?.thesis ?? "");
  const [section, setSection] = useState(initial?.section ?? "");
  const [bannerPath, setBannerPath] = useState(initial?.banner_path ?? "");
  const [summaryMd, setSummaryMd] = useState(initial?.summary_md ?? "");
  const [adminNotesMd, setAdminNotesMd] = useState(initial?.admin_notes_md ?? "");
  const [visibility, setVisibility] = useState<AnalysisVisibility>(
    initial?.visibility ?? "hidden",
  );
  const [showAdminNotes, setShowAdminNotes] = useState(
    Boolean(initial?.admin_notes_md),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  // Prediction state
  const [predAsset, setPredAsset] = useState(initial?.prediction_asset ?? "");
  const [predSource, setPredSource] = useState<PredictionSource | "">(
    (initial?.prediction_source as PredictionSource | null) ?? "",
  );
  const [predDirection, setPredDirection] = useState<PredictionDirection | "">(
    (initial?.prediction_direction as PredictionDirection | null) ?? "",
  );
  const [predBaseline, setPredBaseline] = useState<string>(
    initial?.prediction_baseline_value?.toString() ?? "",
  );
  const [predTarget, setPredTarget] = useState<string>(
    initial?.prediction_target_value?.toString() ?? "",
  );
  const [predStart, setPredStart] = useState(initial?.prediction_start_date ?? "");
  const [predEnd, setPredEnd] = useState(initial?.prediction_end_date ?? "");
  const [predUnit, setPredUnit] = useState(initial?.prediction_unit ?? "");
  const [showPrediction, setShowPrediction] = useState(
    Boolean(initial?.has_prediction),
  );

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched && mode === "create") {
      setSlug(
        v
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80),
      );
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createAnalysis(fd)
          : await updateAnalysis(initial!.id, fd);

      if (res.error) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      toast(mode === "create" ? "Análisis creado" : "Guardado", "success");
      const nextSlug = res.success ? res.slug : slug;
      if (mode === "create") {
        router.push(`/admin/analisis/${nextSlug}`);
      } else if (nextSlug !== initial!.slug) {
        router.replace(`/admin/analisis/${nextSlug}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.formHeader}>
        <div>
          <Link href="/admin/analisis" className={styles.backLink}>
            ← Análisis
          </Link>
          <h1 className={styles.formTitle}>
            {mode === "create" ? "Nuevo análisis" : initial?.title}
          </h1>
        </div>
        {mode === "edit" && initial && visibility !== "hidden" && (
          <Link
            href={`/analisis/${initial.slug}`}
            target="_blank"
            className={crud.btnSecondary}
          >
            Ver en vivo ↗
          </Link>
        )}
      </div>

      <form onSubmit={onSubmit}>
        {/* --- Metadata básica --- */}
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>Metadata</div>

          <div className={styles.formGrid}>
            <label className={crud.field}>
              <span className={crud.fieldLabel}>Título *</span>
              <input
                name="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                required
                className={crud.input}
                placeholder="Tesis de inversión en cobre"
              />
            </label>

            <label className={crud.field}>
              <span className={crud.fieldLabel}>Slug</span>
              <input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className={crud.input}
                placeholder="tesis-cobre-2026"
              />
            </label>

            <label className={crud.field}>
              <span className={crud.fieldLabel}>Subtítulo</span>
              <input
                name="subtitle"
                value={subtitle ?? ""}
                onChange={(e) => setSubtitle(e.target.value)}
                className={crud.input}
                placeholder="Déficit estructural de oferta para 2026–2028"
              />
            </label>

            <label className={crud.field}>
              <span className={crud.fieldLabel}>Sección</span>
              <input
                name="section"
                value={section ?? ""}
                onChange={(e) => setSection(e.target.value)}
                className={crud.input}
                placeholder="Deep Dive · Macro · Cripto..."
              />
            </label>

            <label className={crud.field}>
              <span className={crud.fieldLabel}>Activo</span>
              <input
                name="asset"
                value={asset ?? ""}
                onChange={(e) => setAsset(e.target.value)}
                className={crud.input}
                placeholder="copper / BTC / AAPL"
              />
            </label>

            <label className={crud.field}>
              <span className={crud.fieldLabel}>Tesis (una línea)</span>
              <input
                name="thesis"
                value={thesis ?? ""}
                onChange={(e) => setThesis(e.target.value)}
                className={crud.input}
                placeholder="Bullish cobre 2026 — déficit de oferta acelera"
              />
            </label>

            <label className={crud.field} style={{ gridColumn: "1 / -1" }}>
              <span className={crud.fieldLabel}>Banner (ruta en /public)</span>
              <input
                name="banner_path"
                value={bannerPath ?? ""}
                onChange={(e) => setBannerPath(e.target.value)}
                className={crud.input}
                placeholder="/assets/analisis/cobre-banner.jpg"
              />
            </label>
          </div>
        </div>

        {/* --- Resumen público (markdown) --- */}
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>
            Resumen público
            <span className={styles.sectionHint}>
              Markdown — esto es lo que verán lectores y miembros
            </span>
          </div>

          <div className={styles.editorSplit}>
            <div className={styles.editorPane}>
              <span className={styles.paneLabel}>Editor</span>
              <textarea
                name="summary_md"
                value={summaryMd}
                onChange={(e) => setSummaryMd(e.target.value)}
                className={styles.mdTextarea}
                placeholder="## Tesis

Cobre entra en déficit estructural por..."
              />
            </div>
            <div className={styles.editorPane}>
              <span className={styles.paneLabel}>Preview</span>
              <div className={styles.mdPreview}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {summaryMd || "_Vacío_"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* --- Predicción (opcional) --- */}
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>
            Predicción
            <span className={styles.sectionHint}>
              Opcional — si la tesis tiene una predicción medible
            </span>
          </div>

          {!showPrediction ? (
            <button
              type="button"
              onClick={() => setShowPrediction(true)}
              className={styles.adminNotesToggle}
            >
              + Añadir predicción medible
            </button>
          ) : (
            <>
              <div className={styles.formGrid}>
                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Activo a seguir</span>
                  <input
                    name="prediction_asset"
                    value={predAsset ?? ""}
                    onChange={(e) => setPredAsset(e.target.value)}
                    className={crud.input}
                    placeholder="BTCUSDT (Binance) · HG=F (cobre) · AAPL..."
                  />
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Fuente</span>
                  <select
                    name="prediction_source"
                    value={predSource}
                    onChange={(e) =>
                      setPredSource(e.target.value as PredictionSource | "")
                    }
                    className={crud.input}
                  >
                    <option value="">—</option>
                    <option value="manual">Manual</option>
                    <option value="binance">Binance (auto)</option>
                  </select>
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Dirección</span>
                  <select
                    name="prediction_direction"
                    value={predDirection}
                    onChange={(e) =>
                      setPredDirection(e.target.value as PredictionDirection | "")
                    }
                    className={crud.input}
                  >
                    <option value="">—</option>
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Unidad</span>
                  <input
                    name="prediction_unit"
                    value={predUnit ?? ""}
                    onChange={(e) => setPredUnit(e.target.value)}
                    className={crud.input}
                    placeholder="USD · USD/lb · %..."
                  />
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Valor baseline</span>
                  <input
                    name="prediction_baseline_value"
                    type="number"
                    step="any"
                    value={predBaseline}
                    onChange={(e) => setPredBaseline(e.target.value)}
                    className={crud.input}
                    placeholder="4.25"
                  />
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Valor objetivo</span>
                  <input
                    name="prediction_target_value"
                    type="number"
                    step="any"
                    value={predTarget}
                    onChange={(e) => setPredTarget(e.target.value)}
                    className={crud.input}
                    placeholder="5.50 (opcional)"
                  />
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Fecha inicio</span>
                  <input
                    name="prediction_start_date"
                    type="date"
                    value={predStart ?? ""}
                    onChange={(e) => setPredStart(e.target.value)}
                    className={crud.input}
                  />
                </label>

                <label className={crud.field}>
                  <span className={crud.fieldLabel}>Fecha fin (horizonte)</span>
                  <input
                    name="prediction_end_date"
                    type="date"
                    value={predEnd ?? ""}
                    onChange={(e) => setPredEnd(e.target.value)}
                    className={crud.input}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPrediction(false);
                  setPredAsset("");
                  setPredSource("");
                  setPredDirection("");
                  setPredBaseline("");
                  setPredTarget("");
                  setPredStart("");
                  setPredEnd("");
                  setPredUnit("");
                }}
                className={styles.adminNotesToggle}
                style={{ marginTop: 12 }}
              >
                Quitar predicción
              </button>
            </>
          )}
        </div>

        {/* --- Notas admin (log Claude Code) --- */}
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>
            Notas admin
            <span className={styles.sectionHint}>
              Log extendido — nunca se muestra al público ni a miembros
            </span>
          </div>

          <div className={styles.adminNotesBanner}>
            ⚠ Este campo no se envía a clientes no-admin. Úsalo para el log de
            la conversación en Claude Code y material de trabajo.
          </div>

          {!showAdminNotes ? (
            <button
              type="button"
              onClick={() => setShowAdminNotes(true)}
              className={styles.adminNotesToggle}
            >
              + Añadir notas admin
            </button>
          ) : (
            <textarea
              name="admin_notes_md"
              value={adminNotesMd ?? ""}
              onChange={(e) => setAdminNotesMd(e.target.value)}
              className={styles.mdTextarea}
              placeholder="Log de la conversación, fuentes, borradores..."
              style={{ minHeight: 240 }}
            />
          )}
        </div>

        {/* --- Visibilidad --- */}
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>Visibilidad</div>
          <div className={styles.visibilityRadios}>
            {VISIBILITIES.map((v) => (
              <label
                key={v.value}
                className={`${styles.visibilityRadio} ${visibility === v.value ? styles.visibilityRadioChecked : ""}`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v.value}
                  checked={visibility === v.value}
                  onChange={() => setVisibility(v.value)}
                />
                <span className={styles.visibilityRadioTitle}>{v.title}</span>
                <span className={styles.visibilityRadioHint}>{v.hint}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className={crud.formError} style={{ marginBottom: 16 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/admin/analisis" className={crud.btnSecondary}>
            Cancelar
          </Link>
          <button type="submit" disabled={pending} className={crud.btnPrimary}>
            {pending ? "Guardando..." : mode === "create" ? "Crear análisis" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
