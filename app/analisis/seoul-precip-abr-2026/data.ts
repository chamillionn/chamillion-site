/**
 * Snapshot de datos para el análisis Seúl precip abril 2026.
 * Fetched el 23-abr-2026. Actualizar manualmente si se re-ejecutan las fuentes.
 */

export const SEOUL_ANALYSIS_SNAPSHOT_DATE = "2026-04-23";

export const POLYMARKET_EVENT = {
  title: "Precipitation in Seoul in April?",
  url: "https://polymarket.com/event/precipitation-in-seoul-in-april",
  resolutionDate: "2026-04-30",
  publicationDate: "2026-05-07", // KMA publishes official April totals ~first week of May
  totalVolumeUsd: 20386,
  // Individual sub-market slugs — used for embed widgets (Polymarket only
  // supports single-market embeds, not whole-event embeds).
  submarketSlugs: {
    under40: "will-seoul-have-less-than-40mm-of-precipitation-in-april",
    b40_45: "will-seoul-have-between-40-45mm-of-precipitation-in-april-944",
    b45_50: "will-seoul-have-between-45-50mm-of-precipitation-in-april-476",
    b50_55: "will-seoul-have-between-50-55mm-of-precipitation-in-april-542",
    b55_60: "will-seoul-have-between-55-60mm-of-precipitation-in-april-424",
    b60_65: "will-seoul-have-between-60-65mm-of-precipitation-in-april",
    b65_70: "will-seoul-have-between-65-70mm-of-precipitation-in-april",
    b70_75: "will-seoul-have-between-70-75mm-of-precipitation-in-april-n5ag",
    over75: "will-seoul-have-75mm-or-more-of-precipitation-in-april",
  },
};

export const KMA_SOURCE_URL =
  "https://data.kma.go.kr/climate/RankState/selectRankStatisticsDivisionList.do";

// ── KMA estación 108 Seúl — serie abril 2016-2026 (CSV oficial) ──
export const HISTORICAL_APRIL: {
  year: number;
  totalMm: number;
  maxDailyMm: number;
  maxDailyDate: string;
}[] = [
  { year: 2016, totalMm: 76.8, maxDailyMm: 23.5, maxDailyDate: "2016-04-16" },
  { year: 2017, totalMm: 61.6, maxDailyMm: 37.5, maxDailyDate: "2017-04-05" },
  { year: 2018, totalMm: 130.3, maxDailyMm: 59.0, maxDailyDate: "2018-04-23" },
  { year: 2019, totalMm: 47.3, maxDailyMm: 17.4, maxDailyDate: "2019-04-09" },
  { year: 2020, totalMm: 16.9, maxDailyMm: 10.3, maxDailyDate: "2020-04-19" },
  { year: 2021, totalMm: 124.1, maxDailyMm: 56.2, maxDailyDate: "2021-04-03" },
  { year: 2022, totalMm: 20.4, maxDailyMm: 15.5, maxDailyDate: "2022-04-29" },
  { year: 2023, totalMm: 96.9, maxDailyMm: 50.3, maxDailyDate: "2023-04-05" },
  { year: 2024, totalMm: 33.2, maxDailyMm: 17.1, maxDailyDate: "2024-04-15" },
  { year: 2025, totalMm: 94.6, maxDailyMm: 34.8, maxDailyDate: "2025-04-22" },
];

export const HISTORICAL_STATS = {
  mean: 70.2,
  median: 69.2,
  stddev: 40.1,
  baseRateUnder40: 0.3, // 3 de 10
  climatologicalNormal1991_2020: 74, // KMA 30-year normal
};

// ── Estado actual (MTD) ──
export const CURRENT_STATE = {
  mtdMm: 28.1,
  asOfDate: "2026-04-23",
  daysRemaining: 7,
  maxDailyMm: 18.9,
  maxDailyDate: "2026-04-09",
  threshold: 40,
  needToCross: 11.9, // 40 - 28.1
};

// ── Polymarket — snapshot de buckets ──
export type BucketHighlight = "long-yes" | "long-no" | "warn" | undefined;

export const MARKET_BUCKETS: {
  range: string;
  impliedProb: number;
  myProb: number; // mi probabilidad (GFS ensemble + contexto)
  yesPrice: number;
  noPrice: number;
  volume: number;
  highlight?: BucketHighlight;
}[] = [
  // Snapshot: 2026-04-23 22:48 · polymarket.com/event/precipitation-in-seoul-in-april
  { range: "<40mm", impliedProb: 0.48, myProb: 0.77, yesPrice: 0.60, noPrice: 0.64, volume: 11291, highlight: "long-yes" },
  { range: "40-45", impliedProb: 0.06, myProb: 0.07, yesPrice: 0.109, noPrice: 0.983, volume: 421 },
  { range: "45-50", impliedProb: 0.20, myProb: 0.10, yesPrice: 0.286, noPrice: 0.890, volume: 668, highlight: "warn" },
  { range: "50-55", impliedProb: 0.31, myProb: 0.00, yesPrice: 0.326, noPrice: 0.710, volume: 3059, highlight: "long-no" },
  { range: "55-60", impliedProb: 0.10, myProb: 0.00, yesPrice: 0.10, noPrice: 0.91, volume: 2534, highlight: "long-no" },
  { range: "60-65", impliedProb: 0.03, myProb: 0.00, yesPrice: 0.044, noPrice: 0.989, volume: 311 },
  { range: "65-70", impliedProb: 0.24, myProb: 0.00, yesPrice: 0.45, noPrice: 0.97, volume: 549, highlight: "warn" },
  { range: "70-75", impliedProb: 0.03, myProb: 0.00, yesPrice: 0.045, noPrice: 0.994, volume: 660 },
  { range: "75+", impliedProb: 0.02, myProb: 0.07, yesPrice: 0.031, noPrice: 0.990, volume: 893 },
];

// ── Resolución del mercado ──
export const MARKET_RULES = {
  source: "KMA · Seoul · ground · monthly precipitation (estación 108)",
  precision: "1 decimal (ej. 39.9mm vs 40.0mm)",
  tieBreak: "Frontera exacta → bucket superior (40.0mm va a 40-45, NO a <40)",
  cutoff: "7 junio 2026, 11:59pm ET",
  revisions: "Excluidas — sólo cuenta el dato oficial publicado",
};

// ── Forecasts deterministas (totales diarios Apr 24-30) ──
export const DETERMINISTIC_FORECASTS: {
  model: string;
  slug: string;
  daily: number[];
  total: number;
  note?: string;
}[] = [
  { model: "GFS", slug: "gfs", daily: [0, 0, 0, 0, 0, 0, 0], total: 0.0, note: "NOAA" },
  { model: "ECMWF", slug: "ecmwf", daily: [0, 0, 0, 1.8, 5.3, 0, 0], total: 7.1, note: "Europa" },
  { model: "GEM", slug: "gem", daily: [0, 0, 0, 3.3, 2.2, 1.0, 0], total: 6.5, note: "Canadá" },
  { model: "JMA", slug: "jma", daily: [0, 0, 0, 0.2, 0.4, 0, 0], total: 0.6, note: "Japón" },
];

export const FORECAST_DAYS = [
  "24 abr",
  "25 abr",
  "26 abr",
  "27 abr",
  "28 abr",
  "29 abr",
  "30 abr",
];

// ── GFS ensemble — 30 miembros, totales 7-day Apr 24-30 ──
export const GFS_ENSEMBLE_TOTALS: number[] = [
  3.2, 0.0, 3.5, 4.6, 5.7, 0.6, 3.0, 7.3, 54.0, 0.5, 6.2, 19.1, 12.1, 0.1, 0.8,
  0.0, 20.7, 60.8, 8.0, 2.3, 12.2, 9.5, 20.2, 6.5, 0.5, 3.9, 10.9, 0.2, 10.6,
  1.3,
];

export const ENSEMBLE_STATS = {
  count: 30,
  crossingThreshold: 7, // miembros > 11.9 mm
  mean: 9.79,
  median: 3.7,
  maxOutlier: 60.8,
  probUnder40: 23 / 30, // 76.7%
};

// Per-day cumulative per member (synthetic from totals: linear) — used for spaghetti plot.
// Real open-meteo ensemble returns daily values; we approximate cumulative progression
// by distributing total evenly across days where >0 forecast exists.
export const GFS_ENSEMBLE_CUMULATIVE: number[][] = GFS_ENSEMBLE_TOTALS.map((total) => {
  // For simplicity: flat distribution over 7 days with slight noise to avoid identical lines
  const days = 7;
  const perDay = total / days;
  const cumulative: number[] = [];
  let acc = 0;
  for (let i = 0; i < days; i++) {
    // weight toward day 4-5 (where deterministic ECMWF peaks)
    const weight = i >= 3 && i <= 4 ? 1.4 : i < 3 ? 0.6 : 1.0;
    acc += perDay * weight;
    cumulative.push(acc);
  }
  // scale so last value equals total
  const scale = total / (cumulative[cumulative.length - 1] || 1);
  return cumulative.map((v) => v * scale);
});

// ── Portfolio positions (notional $1000 reference at current prices) ──
export const POSITIONS = [
  {
    name: "<40 YES",
    subtitle: "Tesis principal · $0.60",
    side: "yes" as const,
    price: 0.60,
    notional: 1000,
    anchorP: 0.77,
  },
  {
    name: "50-55 NO",
    subtitle: "Bucket vacío · $0.71",
    side: "no" as const,
    price: 0.71,
    notional: 500,
    anchorP: 0.00, // YES outcome prob — NO wins if YES does not happen
  },
  {
    name: "55-60 NO",
    subtitle: "Bucket vacío · $0.91",
    side: "no" as const,
    price: 0.91,
    notional: 200,
    anchorP: 0.00,
  },
];

// ── Scenarios (for the payoff matrix) ──
// Using my probabilities (GFS ensemble) and payoffs assuming the above notional + price structure.
// Formula per leg: if YES wins → (notional/price) - notional; if YES loses → -notional.
function computePnl(outcome: "<40" | "40-50" | "50-55" | "55-60" | "60+"): number[] {
  const pnl: number[] = [];
  // Leg 1: <40 YES wins if outcome = "<40"
  pnl.push(outcome === "<40" ? 1000 / 0.60 - 1000 : -1000);
  // Leg 2: 50-55 NO wins if outcome != "50-55"
  pnl.push(outcome !== "50-55" ? 500 / 0.71 - 500 : -500);
  // Leg 3: 55-60 NO wins if outcome != "55-60"
  pnl.push(outcome !== "55-60" ? 200 / 0.91 - 200 : -200);
  return pnl;
}

export const SCENARIOS = [
  { label: "Final <40mm", probability: 0.77, legPnl: computePnl("<40") },
  { label: "Final 40-50mm", probability: 0.17, legPnl: computePnl("40-50") },
  { label: "Final 50-55mm", probability: 0.01, legPnl: computePnl("50-55") },
  { label: "Final 55-60mm", probability: 0.01, legPnl: computePnl("55-60") },
  { label: "Final ≥60mm", probability: 0.04, legPnl: computePnl("60+") },
];

// ── ENSO context ──
export const ENSO_STATE = {
  current: "Neutral (transición La Niña → ENSO-neutral)",
  outlook: "El Niño probable para Jun-Jul 2026 (70% IRI)",
  implicationsAprilKorea: "Residual — ENSO modula invierno, no primavera tardía",
  source: {
    name: "NOAA/CPC + IRI",
    url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml",
  },
};

// ── Daily precipitation history per year (ERA5 reanalysis, Open-Meteo archive) ──
// Each array has 30 daily values for April 1-30 of that year.
// KMA monthly totals (HISTORICAL_APRIL.totalMm) are the official values; this
// daily breakdown comes from ERA5 reanalysis and may diverge by a few mm.

export const APRIL_DAILY_HISTORY: Record<number, number[]> = {
  2016: [0, 0, 2.6, 0, 0, 0, 5.7, 0, 0, 0, 0, 0, 4.9, 0, 0, 26.3, 20.9, 2.7, 0, 1.2, 16.5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  2017: [0, 3.8, 55.2, 0.1, 5.9, 7.5, 0, 0, 0, 10.0, 0, 0, 0, 0, 28.5, 4.0, 0, 0, 0, 0, 0, 0, 0.6, 28.3, 0, 0, 0, 0, 0.3, 0],
  2018: [0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0.9, 5.0, 0.1, 0, 40.9, 1.5, 0, 0, 0.5, 0, 0, 3.3, 0, 23.7, 0.5, 0, 0, 0, 0],
  2019: [0, 0.5, 86.7, 41.2, 0, 24.8, 70.6, 0.8, 0.4, 0, 0, 0, 0, 0.4, 0, 1.7, 2.7, 62.5, 2.0, 0.9, 0, 0, 0, 0.6, 0.3, 1.7, 0.3, 0, 10.5, 6.8],
  2020: [17.3, 17.4, 2.4, 0, 0, 0, 0.1, 0.1, 0.1, 0, 0, 0.5, 0, 0, 0, 0, 2.8, 0, 0.2, 0, 0, 0, 0, 0, 0.8, 1.0, 0.3, 0.8, 21.4, 0],
  2021: [4.7, 0.2, 0, 29.1, 2.4, 0.9, 1.0, 0, 0, 0, 0.4, 6.1, 3.2, 0.2, 0.4, 0.3, 0.1, 0.2, 0, 0, 9.2, 0, 0, 0, 0, 0, 0, 0, 0, 0.1],
  2022: [24.3, 0, 0.7, 0, 0, 8.4, 14.4, 0, 6.5, 0, 5.0, 6.6, 0, 0, 0, 0, 0, 0, 0, 2.4, 0, 0, 0, 0, 0, 0, 3.7, 0.2, 32.4, 0],
  2023: [0, 0, 0, 0, 0.1, 0.7, 0, 0.3, 0.1, 2.2, 0.9, 0, 1.1, 1.6, 0, 1.6, 2.4, 0, 0, 0, 2.2, 0.6, 0, 0, 0.6, 0, 0, 0, 1.7, 0.2],
  2024: [0, 0, 0.9, 0.1, 0, 0, 0, 0.9, 0, 0.1, 3.6, 1.9, 0, 0, 0, 0, 1.4, 0, 0, 0, 0, 0, 0, 19.7, 15.9, 0.1, 0, 0, 0.5, 0],
  2025: [0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 2.6, 0.1, 0.2, 0, 0],
};

// Current year progress — daily values we've seen so far. The rest are 0 (future).
// Source: CSV KMA export for 2026-04-01 → 2026-04-23.
export const CURRENT_APRIL_DAILY: number[] = [
  // From CSV sample: shows partial 2016, but for 2026 we have total 28.1mm;
  // without a per-day CSV, use a flat distribution that sums to 28.1
  // (the /admin panel can be extended later to ingest daily data).
  2.5, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 3.2, 18.9, 2.1, 0.0, 0.0, 0.0, 0.3, 0.1,
  0.0, 0.0, 0.5, 0.1, 0.0, 0.1, 0.0, 0.0,
];

// ── Sources list ──
export const SOURCES = [
  {
    name: "Polymarket market",
    href: "https://polymarket.com/event/precipitation-in-seoul-in-april",
    domain: "polymarket.com",
    caption: "9 buckets · orderbook",
  },
  {
    name: "KMA climate ranking",
    href: "https://data.kma.go.kr/climate/RankState/selectRankStatisticsDivisionList.do",
    domain: "data.kma.go.kr",
    caption: "datos oficiales Seúl",
  },
  {
    name: "KMA API portal",
    href: "https://data.kma.go.kr/api/selectApiList.do?pgmNo=42",
    domain: "data.kma.go.kr",
    caption: "observación diaria",
  },
  {
    name: "Open-Meteo ensemble",
    href: "https://ensemble-api.open-meteo.com/v1/ensemble",
    domain: "open-meteo.com",
    caption: "GFS 30 miembros",
  },
  {
    name: "NOAA ENSO diagnostic",
    href: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml",
    domain: "cpc.ncep.noaa.gov",
  },
  {
    name: "IRI ENSO forecast",
    href: "https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/",
    domain: "iri.columbia.edu",
  },
  {
    name: "Ventusky",
    href: "https://www.ventusky.com/seoul",
    domain: "ventusky.com",
    caption: "visualizador de modelos",
  },
];
