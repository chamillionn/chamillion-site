/**
 * Registry of flagship bespoke analyses shipped with the codebase.
 *
 * Each entry maps 1:1 to a folder under `app/analisis/<slug>/` with a custom
 * page.tsx. On admin list load, the registry is reconciled with the DB:
 *  - Missing rows are inserted with visibility='hidden' (user publishes by
 *    toggling from the admin UI).
 *  - Existing rows have their metadata (title, asset, thesis, prediction)
 *    updated from the registry — visibility and published_at are never
 *    overwritten.
 *
 * To ship a new analysis:
 *   1. Create `app/analisis/<slug>/page.tsx` with the bespoke UI.
 *   2. Add an entry here.
 *   3. Admin visits /admin/analisis → row appears, toggles to public/premium.
 */

export type PredictionDirection = "bullish" | "bearish" | "neutral";
export type PredictionSource = "manual" | "binance";

export interface RegistryPrediction {
  asset: string;
  source: PredictionSource;
  direction: PredictionDirection;
  baselineValue: number;
  targetValue: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  unit: string;
}

export interface AnalysisRegistryEntry {
  slug: string;
  title: string;
  subtitle?: string;
  thesis?: string;
  asset?: string;
  section?: string;
  bannerPath?: string;
  prediction?: RegistryPrediction;
}

export const ANALYSIS_REGISTRY: AnalysisRegistryEntry[] = [
  {
    slug: "seoul-precip-abr-2026",
    title: "Precipitación Seúl <40mm — abril 2026",
    subtitle: "Tesis long <40 YES + dos NOs de mispricing",
    thesis: "Long <40 YES + hedge 50-55 y 55-60 NO — EV combinado +$1.5k",
    asset: "POLY:seoul-rain-apr26",
    section: "Prediction Markets",
    prediction: {
      asset: "KMA_SEOUL_APR2026_MM",
      source: "manual",
      direction: "bearish",
      baselineValue: 28.1,
      targetValue: 40,
      startDate: "2026-04-23",
      endDate: "2026-04-30",
      unit: "mm",
    },
  },
];
