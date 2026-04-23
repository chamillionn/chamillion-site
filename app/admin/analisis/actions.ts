"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { fetchCandles } from "@/lib/binance";
import type { AnalysisVisibility } from "@/lib/supabase/types";

const VALID_VISIBILITIES = ["public", "premium", "hidden"] as const;

function isVisibility(v: string | null): v is AnalysisVisibility {
  return v !== null && (VALID_VISIBILITIES as readonly string[]).includes(v);
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

export async function setAnalysisVisibility(id: string, visibility: AnalysisVisibility) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };
  if (!isVisibility(visibility)) return { error: "Visibilidad inválida" };

  const db = admin.dataClient;
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

  const db = admin.dataClient;
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

/* ── Observations (manual tracking panel) ── */

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
  const typedSource = source as (typeof VALID_OBS_SOURCES)[number];

  const db = admin.dataClient;
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

  const db = admin.dataClient;
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

  const db = admin.dataClient;
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
