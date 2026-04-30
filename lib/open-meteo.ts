/**
 * Open-Meteo forecast fetchers — no API key, free tier.
 *
 * Used for the Seoul precipitation analysis: fetches deterministic model
 * forecasts (GFS, GEM, JMA) and the GFS ensemble (30 members) for any
 * lat/lon + date window.
 *
 * ECMWF high-res (IFS 0.25°) requires a paid plan; the open variant
 * (ecmwf_ifs025) is available but lags ~24h. We fetch it and mark it
 * clearly in the returned data.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface DeterministicForecast {
  model: string;
  slug: string;
  /** Precipitation per day (mm), aligned to `forecastDays` */
  daily: number[];
  /** Sum of daily values */
  total: number;
  note?: string;
  /** Whether this model returned actual data (false = API error / no data) */
  ok: boolean;
}

export interface EnsembleForecast {
  /** Total precip per member over the full date window (mm) */
  memberTotals: number[];
  /** Per-member daily arrays, indexed [member][day] */
  memberDaily: number[][];
  count: number;
  mean: number;
  median: number;
  /** Days array aligned to memberDaily */
  days: string[];
  /** Members whose total exceeds the given threshold */
  countAboveThreshold: (threshold: number) => number;
  probBelow: (threshold: number) => number;
}

export interface OpenMeteoResult {
  deterministic: DeterministicForecast[];
  ensemble: EnsembleForecast;
  /** ISO dates of the forecast window, e.g. ["2026-04-24", ..., "2026-04-30"] */
  forecastDays: string[];
  fetchedAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const ENSEMBLE_BASE = "https://ensemble-api.open-meteo.com/v1/ensemble";

const DETERMINISTIC_MODELS = [
  { slug: "gfs_seamless",  label: "GFS",   note: "NOAA" },
  { slug: "gem_seamless",  label: "GEM",   note: "Canadá" },
  { slug: "jma_seamless",  label: "JMA",   note: "Japón" },
  { slug: "ecmwf_ifs025", label: "ECMWF", note: "IFS open · ~24h lag" },
] as const;

const GFS_ENSEMBLE_MODEL = "gfs025"; // 30 members

// ── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function mean(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function datesToIso(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cur = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// ── Deterministic fetch ───────────────────────────────────────────────────────

async function fetchDeterministic(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<DeterministicForecast[]> {
  const models = DETERMINISTIC_MODELS.map((m) => m.slug).join(",");
  const url = new URL(FORECAST_BASE);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("models", models);
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "UTC");

  let json: Record<string, unknown>;
  try {
    const res = await fetch(url.toString(), {
      signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    json = await res.json() as Record<string, unknown>;
  } catch {
    // Return stub rows so the UI can still render
    return DETERMINISTIC_MODELS.map((m) => ({
      model: m.label,
      slug: m.slug,
      daily: [],
      total: 0,
      note: m.note,
      ok: false,
    }));
  }

  return DETERMINISTIC_MODELS.map((m) => {
    const key = `precipitation_sum_${m.slug}`;
    const daily = (json[key] ?? (json as Record<string, unknown[]>)["daily"]
      ? (json as Record<string, { precipitation_sum?: number[] }>)[m.slug]?.precipitation_sum
      : undefined) as number[] | undefined;

    // Open-Meteo multi-model response: keys are like
    //   "precipitation_sum" (if single model) or namespaced with model slug
    // Try both shapes:
    const rawDaily =
      (json as Record<string, number[]>)[key] ??
      (
        (json as Record<string, Record<string, number[]>>)[m.slug] ??
        {}
      )["daily.precipitation_sum"] ??
      null;

    if (!rawDaily) {
      // Try the standard "daily" object shape (when only one model or namespaced differently)
      const dailyObj = json["daily"] as Record<string, unknown> | undefined;
      const valFromDaily = dailyObj?.[key] as number[] | undefined;
      if (valFromDaily) {
        const clean = valFromDaily.map((v) => (v == null ? 0 : round2(v)));
        return {
          model: m.label,
          slug: m.slug,
          daily: clean,
          total: round2(clean.reduce((a, b) => a + b, 0)),
          note: m.note,
          ok: true,
        };
      }
      return { model: m.label, slug: m.slug, daily: [], total: 0, note: m.note, ok: false };
    }

    const clean = rawDaily.map((v) => (v == null ? 0 : round2(v)));
    return {
      model: m.label,
      slug: m.slug,
      daily: clean,
      total: round2(clean.reduce((a, b) => a + b, 0)),
      note: m.note,
      ok: true,
    };
  });
}

// ── Ensemble fetch ────────────────────────────────────────────────────────────

async function fetchEnsemble(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<EnsembleForecast> {
  const url = new URL(ENSEMBLE_BASE);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("models", GFS_ENSEMBLE_MODEL);
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "UTC");

  const days = datesToIso(startDate, endDate);
  const stub: EnsembleForecast = {
    memberTotals: [],
    memberDaily: [],
    count: 0,
    mean: 0,
    median: 0,
    days,
    countAboveThreshold: () => 0,
    probBelow: () => 0,
  };

  let json: Record<string, unknown>;
  try {
    const res = await fetch(url.toString(), {
      signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    json = await res.json() as Record<string, unknown>;
  } catch {
    return stub;
  }

  // Response shape: { daily: { time: string[], precipitation_sum_member01: number[], ... } }
  const daily = json["daily"] as Record<string, number[]> | undefined;
  if (!daily) return stub;

  const memberKeys = Object.keys(daily).filter((k) =>
    k.startsWith("precipitation_sum_member")
  );

  if (!memberKeys.length) return stub;

  // Sort members numerically
  memberKeys.sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10);
    const nb = parseInt(b.replace(/\D/g, ""), 10);
    return na - nb;
  });

  const memberDaily = memberKeys.map((k) =>
    (daily[k] ?? []).map((v) => (v == null ? 0 : round2(v)))
  );

  const memberTotals = memberDaily.map((d) =>
    round2(d.reduce((a, b) => a + b, 0))
  );

  const meanVal = round2(mean(memberTotals));
  const medianVal = round2(median(memberTotals));

  return {
    memberTotals,
    memberDaily,
    count: memberTotals.length,
    mean: meanVal,
    median: medianVal,
    days: (daily["time"] as unknown as string[] | undefined) ?? days,
    countAboveThreshold: (t: number) => memberTotals.filter((v) => v >= t).length,
    probBelow: (t: number) =>
      memberTotals.length > 0
        ? memberTotals.filter((v) => v < t).length / memberTotals.length
        : 0,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch deterministic + ensemble forecasts for a location and date window.
 *
 * @param lat       Latitude (e.g. 37.57 for Seoul)
 * @param lon       Longitude (e.g. 126.98 for Seoul)
 * @param startDate ISO date string, first forecast day (e.g. "2026-04-24")
 * @param endDate   ISO date string, last forecast day   (e.g. "2026-04-30")
 */
export async function fetchForecasts(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<OpenMeteoResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const [deterministic, ensemble] = await Promise.all([
      fetchDeterministic(lat, lon, startDate, endDate, controller.signal),
      fetchEnsemble(lat, lon, startDate, endDate, controller.signal),
    ]);

    return {
      deterministic,
      ensemble,
      forecastDays: datesToIso(startDate, endDate),
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Seoul coordinates — exported for reuse
export const SEOUL_COORDS = { lat: 37.5665, lon: 126.978 } as const;
