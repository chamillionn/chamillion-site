import type { SupabaseClient } from "@supabase/supabase-js";

const ECB_URL =
  "https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=csvdata";

const SETTINGS_KEY = "eurusd_rate";
const DEFAULT_RATE = 1.08; // fallback if both ECB and cache fail

/**
 * Fetch the latest EUR/USD rate from the ECB (European Central Bank).
 * Free, no API key, no rate limits.
 * Returns the rate (e.g. 1.08 means 1 EUR = 1.08 USD).
 */
export async function fetchEurUsdRate(): Promise<number> {
  const res = await fetch(ECB_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`ECB API: HTTP ${res.status}`);

  const csv = await res.text();
  // CSV has header row + data row. Rate is in the OBS_VALUE column.
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("ECB: unexpected CSV format (no data row)");

  const headers = lines[0].split(",");
  const dataLine = lines[lines.length - 1];
  const cols = dataLine.split(",");

  const obsIdx = headers.indexOf("OBS_VALUE");
  const rateStr = obsIdx >= 0 ? cols[obsIdx] : undefined;
  const rate = rateStr ? parseFloat(rateStr) : NaN;

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`ECB: invalid rate parsed: ${rateStr}`);
  }

  return rate;
}

/** Read the cached EUR/USD rate from site_settings. */
export async function getCachedRate(
  supabase: SupabaseClient,
): Promise<number | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .single();

  const rate = typeof data?.value === "number" ? data.value : null;
  return rate && rate > 0 ? rate : null;
}

/** Save the EUR/USD rate to site_settings (upsert). */
export async function saveCachedRate(
  supabase: SupabaseClient,
  rate: number,
): Promise<void> {
  await supabase.from("site_settings").upsert(
    { key: SETTINGS_KEY, value: rate, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
}

/**
 * Get the EUR/USD rate with fallback chain:
 * 1. Fetch from ECB (live)
 * 2. Use cached rate from DB
 * 3. Use hardcoded default (1.08)
 */
export async function resolveEurUsdRate(
  supabase: SupabaseClient,
): Promise<{ rate: number; source: string }> {
  // 1. Try ECB
  try {
    const rate = await fetchEurUsdRate();
    await saveCachedRate(supabase, rate).catch(() => {/* ignore save errors */});
    return { rate, source: "ECB" };
  } catch { /* fall through */ }

  // 2. Try cached
  const cached = await getCachedRate(supabase).catch(() => null);
  if (cached) return { rate: cached, source: "cached" };

  // 3. Default
  return { rate: DEFAULT_RATE, source: "default" };
}

/** Convert a USD amount to EUR. */
export function usdToEur(usd: number, eurUsdRate: number): number {
  return usd / eurUsdRate;
}
