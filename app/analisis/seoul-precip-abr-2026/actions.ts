"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { requireAdmin } from "@/lib/supabase/admin";
import { getAnalysisForAdmin } from "@/lib/supabase/analyses-client";
import type { TrackerPosition, ForecastSnapshot } from "@/lib/supabase/types";

const SLUG = "seoul-precip-abr-2026";

type AdminCtxError = { ok: false; error: string };
type AdminCtxOk = { ok: true; admin: Awaited<ReturnType<typeof requireAdmin>> & object; analysis: NonNullable<Awaited<ReturnType<typeof getAnalysisForAdmin>>> };

async function getAdminCtx(): Promise<AdminCtxError | AdminCtxOk> {
  const ctx = await requireUser();
  if (!ctx || ctx.profile.role !== "admin") return { ok: false, error: "Sin permisos" };
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Sin permisos" };
  const analysis = await getAnalysisForAdmin(SLUG, admin.dataClient);
  if (!analysis) return { ok: false, error: "Análisis no encontrado" };
  return { ok: true, admin, analysis };
}

/* ─── Step 1: Polymarket positions + prices ──────────────────────────────── */

export async function refreshStepPositions(): Promise<{
  ok: boolean;
  position: TrackerPosition | null;
  summary: string;
  warnings: string[];
}> {
  const r = await getAdminCtx();
  if (!r.ok) return { ok: false, position: null, summary: r.error, warnings: [] };
  const { admin, analysis } = r;

  const { ANALYSIS_REGISTRY } = await import("@/app/analisis/registry");
  const entry = ANALYSIS_REGISTRY.find((e) => e.slug === SLUG);
  if (!entry?.tracker || entry.tracker.kind !== "polymarket") {
    return { ok: false, position: null, summary: "Sin tracker Polymarket configurado", warnings: [] };
  }

  const { polymarketResolver } = await import("@/lib/trackers/polymarket");
  try {
    const tick = await polymarketResolver(analysis, entry.tracker, { db: admin.dataClient });
    const legs = tick.position?.legs ?? [];
    const totalPnl = tick.position?.totalCashPnl ?? 0;
    const sign = totalPnl >= 0 ? "+" : "";
    const summary = legs.length > 0
      ? `${legs.length} posiciones · PnL ${sign}$${Math.abs(totalPnl).toFixed(2)}`
      : "Sin posiciones abiertas";
    return { ok: true, position: tick.position, summary, warnings: tick.warnings ?? [] };
  } catch (e) {
    return { ok: false, position: null, summary: String(e), warnings: [] };
  }
}

/* ─── Step 2: Open-Meteo forecasts ──────────────────────────────────────── */

export async function refreshStepForecasts(): Promise<{
  ok: boolean;
  forecasts: ForecastSnapshot | null;
  summary: string;
}> {
  const r = await getAdminCtx();
  if (!r.ok) return { ok: false, forecasts: null, summary: r.error };
  const { analysis } = r;

  const { ANALYSIS_REGISTRY } = await import("@/app/analisis/registry");
  const entry = ANALYSIS_REGISTRY.find((e) => e.slug === SLUG);
  const coords = entry?.tracker?.kind === "polymarket" ? entry.tracker.forecastCoords : undefined;

  if (!coords) return { ok: false, forecasts: null, summary: "Sin coordenadas de forecast en el registry" };
  if (!analysis.prediction_end_date) return { ok: false, forecasts: null, summary: "Sin prediction_end_date" };

  try {
    const { fetchForecasts } = await import("@/lib/open-meteo");
    const today = new Date().toISOString().slice(0, 10);
    const start = today > analysis.prediction_end_date ? analysis.prediction_end_date : today;
    const result = await fetchForecasts(coords.lat, coords.lon, start, analysis.prediction_end_date);

    const forecasts: ForecastSnapshot = {
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

    const okModels = result.deterministic.filter((m) => m.ok).map((m) => m.model).join(", ");
    const ensProb = result.ensemble.count > 0
      ? Math.round(result.ensemble.probBelow(40) * 100)
      : null;
    const summary = [
      okModels ? `Modelos: ${okModels}` : "Sin modelos",
      result.ensemble.count > 0
        ? `Ensemble ${result.ensemble.count} miembros · P(<40mm)=${ensProb}%`
        : null,
    ].filter(Boolean).join(" · ");

    return { ok: true, forecasts, summary };
  } catch (e) {
    return { ok: false, forecasts: null, summary: String(e) };
  }
}

/* ─── Step 3: KMA CSV → observations ─────────────────────────────────────── */

export async function refreshStepKma(csvText: string): Promise<{
  ok: boolean;
  inserted: number;
  updated: number;
  latestMm: number | null;
  latestDate: string | null;
  summary: string;
}> {
  const r = await getAdminCtx();
  if (!r.ok) return { ok: false, inserted: 0, updated: 0, latestMm: null, latestDate: null, summary: r.error };
  const { admin, analysis } = r;

  // Strip UTF-8 BOM and normalize line endings
  const text = csvText.replace(/^\uFEFF/, "");
  const allLines = text.split(/\r?\n/);

  // Strategy: scan every line looking for a column that matches YYYY-MM-DD.
  // The column immediately after it is the precipitation value.
  // This handles KMA's multi-format exports without relying on header matching:
  //   - Garbled EUC-KR headers (Korean encoded as Latin-1 when FileReader reads as UTF-8)
  //   - Leading tab characters per row
  //   - Variable number of prefix columns (station number, station name, ...)
  const DATE_RE = /^(\d{4})[.-](\d{2})[.-](\d{2})$/;

  const rows: { date: string; mm: number }[] = [];
  for (const raw of allLines) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

    // Find first column that looks like a date
    let dateIdx = -1;
    let dateStr = "";
    for (let ci = 0; ci < cols.length; ci++) {
      const m = cols[ci].match(DATE_RE);
      if (!m) continue;
      const candidate = `${m[1]}-${m[2]}-${m[3]}`;
      if (!Number.isNaN(new Date(`${candidate}T12:00:00Z`).getTime())) {
        dateIdx = ci;
        dateStr = candidate;
        break;
      }
    }
    if (dateIdx < 0) continue;

    // Precipitation is the next column after the date
    const rawP = (cols[dateIdx + 1] ?? "").replace(",", ".").trim();
    // Empty / "-" / "--" → 0mm (KMA encodes dry days as blank)
    const mm =
      rawP === "" || rawP === "-" || rawP === "--"
        ? 0
        : parseFloat(rawP);
    if (!Number.isFinite(mm)) continue;
    rows.push({ date: dateStr, mm });
  }

  if (rows.length === 0) {
    return { ok: false, inserted: 0, updated: 0, latestMm: null, latestDate: null, summary: "Sin filas válidas — el CSV no contiene columnas de fecha YYYY-MM-DD reconocibles" };
  }

  const db = admin.dataClient;
  let inserted = 0, updated = 0;

  for (const row of rows) {
    const { data: existing } = await db
      .from("analysis_observations")
      .select("id")
      .eq("analysis_id", analysis.id)
      .gte("observed_at", `${row.date}T00:00:00Z`)
      .lt("observed_at", `${row.date}T23:59:59Z`)
      .maybeSingle();

    if (existing) {
      await db.from("analysis_observations").update({ value: row.mm, source: "kma", note: "csv-import" }).eq("id", existing.id);
      updated++;
    } else {
      await db.from("analysis_observations").insert({ analysis_id: analysis.id, observed_at: `${row.date}T12:00:00Z`, value: row.mm, source: "kma", note: "csv-import" });
      inserted++;
    }
  }

  const latest = rows[rows.length - 1];
  const summary = `+${inserted} nuevas · ${updated} actualizadas · último valor ${latest.mm}mm (${latest.date})`;
  return { ok: true, inserted, updated, latestMm: latest.mm, latestDate: latest.date, summary };
}

/* ─── Step 4: Save snapshot ──────────────────────────────────────────────── */

export async function refreshStepSave(opts: {
  position: TrackerPosition | null;
  forecasts: ForecastSnapshot | null;
  latestKmaMm: number | null;
  latestKmaDate: string | null;
}): Promise<{ ok: boolean; summary: string }> {
  const r = await getAdminCtx();
  if (!r.ok) return { ok: false, summary: r.error };
  const { admin, analysis } = r;

  const db = admin.dataClient;

  // Resolve underlying: from this refresh's KMA result → latest observation → fallback
  let underlying = null;
  if (opts.latestKmaMm !== null && opts.latestKmaDate) {
    underlying = {
      value: opts.latestKmaMm,
      unit: analysis.prediction_unit ?? "mm",
      source: "kma",
      asOf: `${opts.latestKmaDate}T12:00:00Z`,
    };
  } else {
    const { data: latestObs } = await db
      .from("analysis_observations")
      .select("observed_at, value, source")
      .eq("analysis_id", analysis.id)
      .order("observed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestObs) {
      underlying = {
        value: Number(latestObs.value),
        unit: analysis.prediction_unit ?? "mm",
        source: latestObs.source ?? "manual",
        asOf: latestObs.observed_at,
      };
    }
  }

  // Simple edge from position PnL
  const edge = opts.position
    ? {
        evAbs: opts.position.totalCashPnl,
        evPct: opts.position.totalCashPnl / Math.max(opts.position.totalNotional ?? 1, 1),
        myProb: 0.77,
        mktProb: 0.48,
        source: "polymarket",
      }
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const basePayload = {
    analysis_id: analysis.id,
    snapshot_date: today,
    underlying,
    position: opts.position,
    edge,
  };

  // Try with forecasts first; if the column doesn't exist yet (migration pending),
  // fall back to saving without it.
  const payloadWithForecasts = { ...basePayload, forecasts: opts.forecasts };
  const { error } = await db
    .from("analysis_snapshots")
    .upsert(payloadWithForecasts, { onConflict: "analysis_id,snapshot_date" });

  if (error) {
    if (error.message.includes("forecasts")) {
      // Column not yet migrated — save without it
      const { error: e2 } = await db
        .from("analysis_snapshots")
        .upsert(basePayload, { onConflict: "analysis_id,snapshot_date" });
      if (e2) return { ok: false, summary: e2.message };
      revalidatePath(`/analisis/${SLUG}`);
      const mtd = underlying ? `MTD ${underlying.value}mm` : "sin MTD";
      return { ok: true, summary: `Snapshot ${today} guardado · ${mtd} (forecasts: migración pendiente)` };
    }
    return { ok: false, summary: error.message };
  }

  revalidatePath(`/analisis/${SLUG}`);
  const mtd = underlying ? `MTD ${underlying.value}mm` : "sin MTD";
  return { ok: true, summary: `Snapshot ${today} guardado · ${mtd}` };
}
