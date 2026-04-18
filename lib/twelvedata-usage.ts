/**
 * Twelve Data usage tracking.
 *
 * Free tier = 8 credits/minute, 800 credits/day. This module owns:
 *  - An auto-block window set when a fetch hits 429, so the proxy can
 *    fail fast without piling on more requests during the cooldown.
 *  - A cached reading of /api_usage for the admin dashboard. Each call
 *    costs 1 credit so we cache for 2 minutes.
 */

export interface UsageSnapshot {
  currentUsage: number;
  planLimit: number;
  dailyUsage: number;
  planDailyLimit: number;
  planCategory: string;
  fetchedAt: number;
}

const USAGE_CACHE_MS = 2 * 60 * 1000;

type GlobalWithState = typeof globalThis & {
  __twelveState?: {
    blockedUntil: number;
    cachedUsage: UsageSnapshot | null;
    inflight: Promise<UsageSnapshot | null> | null;
  };
};

function state() {
  const g = globalThis as GlobalWithState;
  if (!g.__twelveState) {
    g.__twelveState = { blockedUntil: 0, cachedUsage: null, inflight: null };
  }
  return g.__twelveState;
}

/** Called when Twelve Data returns 429. Keeps the proxy quiet for the
 *  cool-off window so we don't add insult to rate-limit injury. */
export function markTwelveBlocked(durationMs = 60_000): void {
  state().blockedUntil = Date.now() + durationMs;
}

export function isTwelveBlocked(now = Date.now()): { blocked: boolean; untilTs: number } {
  const until = state().blockedUntil;
  return { blocked: until > now, untilTs: until };
}

/** Fetch /api_usage. Costs 1 credit against the daily budget, so we
 *  cache for 2 minutes. Pass fresh=true from the admin dashboard for a
 *  real-time read. Returns null if the key is missing or the call fails. */
export async function getTwelveUsage(fresh = false): Promise<UsageSnapshot | null> {
  const s = state();
  const cached = s.cachedUsage;
  if (!fresh && cached && Date.now() - cached.fetchedAt < USAGE_CACHE_MS) {
    return cached;
  }
  if (s.inflight) return s.inflight;

  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) return null;

  s.inflight = (async () => {
    try {
      const res = await fetch(`https://api.twelvedata.com/api_usage?apikey=${key}`, {
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const d = (await res.json()) as {
        current_usage: number;
        plan_limit: number;
        daily_usage: number;
        plan_daily_limit: number;
        plan_category: string;
      };
      const snap: UsageSnapshot = {
        currentUsage: d.current_usage,
        planLimit: d.plan_limit,
        dailyUsage: d.daily_usage,
        planDailyLimit: d.plan_daily_limit,
        planCategory: d.plan_category,
        fetchedAt: Date.now(),
      };
      s.cachedUsage = snap;
      return snap;
    } catch {
      return null;
    } finally {
      s.inflight = null;
    }
  })();

  return s.inflight;
}
