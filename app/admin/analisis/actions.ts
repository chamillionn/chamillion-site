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

  const VALID_OBS_SOURCES = ["manual", "binance", "twelvedata", "kma"] as const;
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

/**
 * Fire the tracker tick for a single analysis on demand (admin button).
 * Calls the same cron endpoint internally.
 */
export async function runTrackerTick(analysisId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const { polymarketResolver } = await import("@/lib/trackers/polymarket");
  const db = admin.dataClient;

  // Load analysis row
  const { data: row, error: loadErr } = await db
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .maybeSingle();
  if (loadErr) return { error: loadErr.message };
  if (!row) return { error: "Analysis not found" };

  // Find the registry entry + tracker config
  const { ANALYSIS_REGISTRY } = await import("@/app/analisis/registry");
  const entry = ANALYSIS_REGISTRY.find((e) => e.slug === row.slug);
  if (!entry?.tracker) return { error: "No tracker config para este análisis" };

  try {
    // Dispatch to the right resolver (only polymarket supported for now)
    if (entry.tracker.kind !== "polymarket") {
      return { error: `Tracker kind no soportado: ${entry.tracker.kind}` };
    }
    const tick = await polymarketResolver(row, entry.tracker, { db });

    // Merge underlying from latest observation if resolver didn't set one
    let underlying = tick.underlying;
    if (!underlying) {
      const { data: latestObs } = await db
        .from("analysis_observations")
        .select("observed_at, value, source")
        .eq("analysis_id", analysisId)
        .order("observed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestObs) {
        underlying = {
          value: Number(latestObs.value),
          unit: row.prediction_unit ?? "",
          source: latestObs.source ?? "manual",
          asOf: latestObs.observed_at,
        };
      }
    }

    // Fetch Open-Meteo forecasts if coords configured
    let forecasts = null;
    const coords = entry.tracker.kind === "polymarket"
      ? entry.tracker.forecastCoords
      : undefined;
    if (coords && row.prediction_end_date) {
      try {
        const { fetchForecasts } = await import("@/lib/open-meteo");
        const today = new Date().toISOString().slice(0, 10);
        // Forecast window: today → prediction_end_date
        const startDate = today > row.prediction_end_date ? row.prediction_end_date : today;
        const result = await fetchForecasts(coords.lat, coords.lon, startDate, row.prediction_end_date);
        forecasts = {
          fetchedAt: result.fetchedAt,
          forecastDays: result.forecastDays,
          deterministic: result.deterministic,
          ensemble: {
            memberTotals: result.ensemble.memberTotals,
            count: result.ensemble.count,
            mean: result.ensemble.mean,
            median: result.ensemble.median,
            days: result.ensemble.days,
          },
        };
      } catch (e) {
        // Non-fatal — warn but don't fail the tick
        tick.warnings = tick.warnings ?? [];
        tick.warnings.push(`Open-Meteo: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const { error: upErr } = await db.from("analysis_snapshots").upsert(
      {
        analysis_id: analysisId,
        snapshot_date: today,
        underlying,
        position: tick.position,
        edge: tick.edge,
        forecasts,
      },
      { onConflict: "analysis_id,snapshot_date" },
    );
    if (upErr) return { error: upErr.message };

    let eventsInserted = 0;
    for (const ev of tick.events) {
      const { error: evErr } = await db.from("analysis_events").insert({
        analysis_id: analysisId,
        occurred_at: ev.occurred_at,
        type: ev.type,
        payload: ev.payload ?? null,
        source: ev.source ?? null,
        dedup_key: ev.dedup_key ?? null,
      });
      if (!evErr) eventsInserted++;
      else if (evErr.code !== "23505") return { error: evErr.message };
    }

    revalidateAll(row.slug);
    return {
      success: true,
      snapshot: "upserted",
      eventsInserted,
      positionLegs: tick.position?.legs.length ?? 0,
      eventsFetched: tick.events.length,
      warnings: tick.warnings ?? [],
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error en tick" };
  }
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

/**
 * Parse and bulk-import a KMA daily precipitation CSV.
 *
 * Accepted formats:
 *   1. KMA export  — columns include "일시" (date) and "일강수량(mm)"
 *   2. Simple 2-col — first col YYYY-MM-DD, second col mm value
 *
 * Rows with missing/zero precipitation are skipped.
 * Duplicate dates (same analysis_id + date) are upserted (update if exists).
 */
export async function importKmaCsv(analysisId: string, csvText: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };
  if (admin.isRemote) return { error: "Modo lectura" };

  const db = admin.dataClient;
  const { data: a } = await db
    .from("analyses")
    .select("slug")
    .eq("id", analysisId)
    .maybeSingle();
  if (!a) return { error: "Análisis no encontrado" };

  // ── Parse CSV ──
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return { error: "CSV vacío o sin filas de datos" };

  // Detect separator (comma or semicolon)
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));

  // Find date and precipitation column indices
  const dateColIdx = headers.findIndex(
    (h) => /일시|date/i.test(h)
  );
  const precipColIdx = headers.findIndex(
    (h) => /일강수량|precipitation|precip|강수|mm/i.test(h)
  );

  // Fallback: assume col 0 = date, col 1 = mm
  const dIdx = dateColIdx >= 0 ? dateColIdx : 0;
  const pIdx = precipColIdx >= 0 ? precipColIdx : 1;

  const rows: { observed_at: string; value: number }[] = [];
  const parseErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const rawDate = cols[dIdx] ?? "";
    const rawPrecip = cols[pIdx] ?? "";

    // Accept YYYY-MM-DD or YYYYMMDD
    const dateStr = rawDate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
    const d = new Date(`${dateStr}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) {
      parseErrors.push(`Línea ${i + 1}: fecha inválida "${rawDate}"`);
      continue;
    }

    const precip = parseFloat(rawPrecip.replace(",", "."));
    if (!Number.isFinite(precip)) continue; // skip blank / non-numeric

    rows.push({ observed_at: d.toISOString(), value: precip });
  }

  if (rows.length === 0) {
    return {
      error: `Sin filas válidas.${parseErrors.length > 0 ? ` Errores: ${parseErrors.slice(0, 3).join("; ")}` : ""}`,
    };
  }

  // Upsert — on conflict (analysis_id + observed_at date) update value
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const { data: existing } = await db
      .from("analysis_observations")
      .select("id, value")
      .eq("analysis_id", analysisId)
      .gte("observed_at", row.observed_at.slice(0, 10) + "T00:00:00Z")
      .lt("observed_at", row.observed_at.slice(0, 10) + "T23:59:59Z")
      .maybeSingle();

    if (existing) {
      await db
        .from("analysis_observations")
        .update({ value: row.value, source: "kma", note: "csv-import" })
        .eq("id", existing.id);
      updated++;
    } else {
      await db.from("analysis_observations").insert({
        analysis_id: analysisId,
        observed_at: row.observed_at,
        value: row.value,
        source: "kma",
        note: "csv-import",
      });
      inserted++;
    }
  }

  revalidateAll(a.slug);
  return {
    success: true,
    inserted,
    updated,
    skipped: rows.length - inserted - updated,
    parseErrors: parseErrors.slice(0, 5),
  };
}
