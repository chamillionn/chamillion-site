"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAnalysesClient } from "@/lib/supabase/analyses-client";
import { fetchCandles } from "@/lib/binance";
import type {
  AnalysisVisibility,
  PredictionDirection,
  PredictionSource,
} from "@/lib/supabase/types";

const VALID_VISIBILITIES = ["public", "premium", "hidden"] as const;
const VALID_DIRECTIONS = ["bullish", "bearish", "neutral"] as const;
const VALID_PRED_SOURCES = ["manual", "binance"] as const;

function isVisibility(v: string | null): v is AnalysisVisibility {
  return v !== null && (VALID_VISIBILITIES as readonly string[]).includes(v);
}

function parseDirection(v: string | null): PredictionDirection | null {
  if (!v || !(VALID_DIRECTIONS as readonly string[]).includes(v)) return null;
  return v as PredictionDirection;
}

function parsePredSource(v: string | null): PredictionSource | null {
  if (!v || !(VALID_PRED_SOURCES as readonly string[]).includes(v)) return null;
  return v as PredictionSource;
}

function parseNum(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: string | null): string | null {
  if (!v) return null;
  // Accept YYYY-MM-DD only.
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function predictionFieldsFromForm(formData: FormData) {
  const prediction_asset = ((formData.get("prediction_asset") as string) || "").trim() || null;
  const prediction_source = parsePredSource(formData.get("prediction_source") as string | null);
  const prediction_direction = parseDirection(formData.get("prediction_direction") as string | null);
  const prediction_baseline_value = parseNum(formData.get("prediction_baseline_value") as string | null);
  const prediction_target_value = parseNum(formData.get("prediction_target_value") as string | null);
  const prediction_start_date = parseDate(formData.get("prediction_start_date") as string | null);
  const prediction_end_date = parseDate(formData.get("prediction_end_date") as string | null);
  const prediction_unit = ((formData.get("prediction_unit") as string) || "").trim() || null;
  return {
    prediction_asset,
    prediction_source,
    prediction_direction,
    prediction_baseline_value,
    prediction_target_value,
    prediction_start_date,
    prediction_end_date,
    prediction_unit,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function revalidateAll(slug?: string) {
  revalidatePath("/admin/analisis");
  revalidatePath("/analisis");
  revalidatePath("/hub/analisis");
  if (slug) revalidatePath(`/analisis/${slug}`);
}

function nowIso() {
  return new Date().toISOString();
}

export async function createAnalysis(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "El título es obligatorio" };

  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  if (!slug) return { error: "Slug inválido" };

  const visibility = formData.get("visibility") as string;
  if (!isVisibility(visibility)) return { error: "Visibilidad inválida" };

  const summaryMd = (formData.get("summary_md") as string) ?? "";
  const adminNotesMd = ((formData.get("admin_notes_md") as string) || "").trim() || null;

  const subtitle = ((formData.get("subtitle") as string) || "").trim() || null;
  const asset = ((formData.get("asset") as string) || "").trim() || null;
  const thesis = ((formData.get("thesis") as string) || "").trim() || null;
  const section = ((formData.get("section") as string) || "").trim() || null;
  const bannerPath = ((formData.get("banner_path") as string) || "").trim() || null;

  const pred = predictionFieldsFromForm(formData);

  const db = createAnalysesClient();
  const { error } = await db.from("analyses").insert({
    slug,
    title,
    subtitle,
    asset,
    thesis,
    section,
    banner_path: bannerPath,
    summary_md: summaryMd,
    admin_notes_md: adminNotesMd,
    visibility,
    published_at: visibility === "hidden" ? null : nowIso(),
    ...pred,
  });

  if (error) return { error: error.message };

  revalidateAll(slug);
  return { success: true, slug };
}

export async function updateAnalysis(id: string, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "El título es obligatorio" };

  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  if (!slug) return { error: "Slug inválido" };

  const visibility = formData.get("visibility") as string;
  if (!isVisibility(visibility)) return { error: "Visibilidad inválida" };

  const summaryMd = (formData.get("summary_md") as string) ?? "";
  const adminNotesMd = ((formData.get("admin_notes_md") as string) || "").trim() || null;
  const subtitle = ((formData.get("subtitle") as string) || "").trim() || null;
  const asset = ((formData.get("asset") as string) || "").trim() || null;
  const thesis = ((formData.get("thesis") as string) || "").trim() || null;
  const section = ((formData.get("section") as string) || "").trim() || null;
  const bannerPath = ((formData.get("banner_path") as string) || "").trim() || null;

  const db = createAnalysesClient();

  const { data: existing } = await db
    .from("analyses")
    .select("visibility,published_at")
    .eq("id", id)
    .maybeSingle();

  const wasHidden = existing?.visibility === "hidden" || !existing?.published_at;
  const goingVisible = visibility !== "hidden";
  const shouldSealPublishedAt = wasHidden && goingVisible;

  const pred = predictionFieldsFromForm(formData);

  const patch: Record<string, unknown> = {
    slug,
    title,
    subtitle,
    asset,
    thesis,
    section,
    banner_path: bannerPath,
    summary_md: summaryMd,
    admin_notes_md: adminNotesMd,
    visibility,
    updated_at: nowIso(),
    ...pred,
  };
  if (shouldSealPublishedAt) patch.published_at = nowIso();

  const { error } = await db.from("analyses").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidateAll(slug);
  return { success: true, slug };
}

export async function setAnalysisVisibility(id: string, visibility: AnalysisVisibility) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };
  if (!isVisibility(visibility)) return { error: "Visibilidad inválida" };

  const db = createAnalysesClient();

  const { data: existing } = await db
    .from("analyses")
    .select("slug,published_at")
    .eq("id", id)
    .maybeSingle();

  const patch: Record<string, unknown> = { visibility, updated_at: nowIso() };
  if (!existing?.published_at && visibility !== "hidden") {
    patch.published_at = nowIso();
  }

  const { error } = await db.from("analyses").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidateAll(existing?.slug);
  return { success: true };
}

export async function deleteAnalysis(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const db = createAnalysesClient();

  const { data: existing } = await db
    .from("analyses")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await db.from("analyses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateAll(existing?.slug);
  return { success: true };
}

/* ── Observations ── */

export async function addObservation(analysisId: string, formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const observedAtRaw = (formData.get("observed_at") as string)?.trim();
  const valueRaw = (formData.get("value") as string)?.trim();
  const source = ((formData.get("source") as string) || "manual").trim();
  const note = ((formData.get("note") as string) || "").trim() || null;

  if (!observedAtRaw) return { error: "Fecha requerida" };
  const observedAt = new Date(observedAtRaw);
  if (Number.isNaN(observedAt.getTime())) return { error: "Fecha inválida" };

  const value = Number(valueRaw);
  if (!Number.isFinite(value)) return { error: "Valor inválido" };

  const VALID_OBS_SOURCES = ["manual", "binance", "twelvedata"] as const;
  if (!(VALID_OBS_SOURCES as readonly string[]).includes(source)) {
    return { error: "Fuente inválida" };
  }
  const typedSource = source as typeof VALID_OBS_SOURCES[number];

  const db = createAnalysesClient();
  const { error } = await db.from("analysis_observations").insert({
    analysis_id: analysisId,
    observed_at: observedAt.toISOString(),
    value,
    source: typedSource,
    note,
  });

  if (error) return { error: error.message };

  const { data: a } = await db
    .from("analyses")
    .select("slug")
    .eq("id", analysisId)
    .maybeSingle();

  revalidateAll(a?.slug);
  return { success: true };
}

export async function deleteObservation(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const db = createAnalysesClient();
  const { data: obs } = await db
    .from("analysis_observations")
    .select("analysis_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await db.from("analysis_observations").delete().eq("id", id);
  if (error) return { error: error.message };

  if (obs?.analysis_id) {
    const { data: a } = await db
      .from("analyses")
      .select("slug")
      .eq("id", obs.analysis_id)
      .maybeSingle();
    revalidateAll(a?.slug);
  }
  return { success: true };
}

export async function pullBinanceObservation(analysisId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const db = createAnalysesClient();
  const { data: a } = await db
    .from("analyses")
    .select("slug,prediction_asset,prediction_source")
    .eq("id", analysisId)
    .maybeSingle();

  if (!a) return { error: "Análisis no encontrado" };
  if (a.prediction_source !== "binance") {
    return { error: "La predicción no usa Binance como fuente" };
  }
  const symbol = (a.prediction_asset || "").toUpperCase().trim();
  if (!symbol) return { error: "Símbolo Binance vacío" };

  try {
    const candles = await fetchCandles(symbol, "1d", 1);
    if (!candles.length) return { error: "Binance no devolvió velas" };
    const c = candles[0];
    const { error } = await db.from("analysis_observations").insert({
      analysis_id: analysisId,
      observed_at: new Date(c.time * 1000).toISOString(),
      value: c.close,
      source: "binance",
      note: null,
    });
    if (error) {
      // Unique constraint on (analysis, source, day) — treat as skip.
      if (error.code === "23505") {
        return { success: true, skipped: true };
      }
      return { error: error.message };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al pullar Binance" };
  }

  revalidateAll(a.slug);
  return { success: true };
}
