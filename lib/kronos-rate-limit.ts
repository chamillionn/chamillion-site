import { createHmac, timingSafeEqual } from "crypto";

export const KRONOS_ANON_COOKIE = "kronos_anon";
export const KRONOS_ANON_MAX = 3;
export const KRONOS_ANON_WINDOW_MS = 24 * 60 * 60 * 1000;

export const KRONOS_IP_MAX_PER_HOUR = 10;
export const KRONOS_IP_WINDOW_MS = 60 * 60 * 1000;
export const KRONOS_SAVE_IP_MAX_PER_HOUR = 5;
export const KRONOS_CANDLES_IP_MAX_PER_HOUR = 40;

export const KRONOS_GLOBAL_DAILY_CAP = Number(
  process.env.KRONOS_GLOBAL_DAILY_CAP ?? 500,
);

export interface AnonCounter {
  count: number;
  windowStart: number;
}

function secret(): string {
  const explicit = process.env.KRONOS_COOKIE_SECRET;
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "KRONOS_COOKIE_SECRET must be set in production",
    );
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-kronos-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function verify(payload: string, sig: string): boolean {
  const expected = sign(payload);
  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export function encodeCounter(counter: AnonCounter): string {
  const payload = Buffer.from(JSON.stringify(counter)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function decodeCounter(raw: string | undefined): AnonCounter {
  if (!raw) return freshCounter();
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return freshCounter();
  if (!verify(payload, signature)) return freshCounter();
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as unknown;
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "count" in decoded &&
      "windowStart" in decoded &&
      typeof (decoded as AnonCounter).count === "number" &&
      typeof (decoded as AnonCounter).windowStart === "number"
    ) {
      return decoded as AnonCounter;
    }
  } catch {
    /* fallthrough */
  }
  return freshCounter();
}

export function freshCounter(): AnonCounter {
  return { count: 0, windowStart: Date.now() };
}

/** Returns effective counter (auto-resets if the window has expired). */
export function effectiveCounter(counter: AnonCounter, now = Date.now()): AnonCounter {
  if (now - counter.windowStart >= KRONOS_ANON_WINDOW_MS) {
    return { count: 0, windowStart: now };
  }
  return counter;
}

export function remaining(counter: AnonCounter): number {
  const eff = effectiveCounter(counter);
  return Math.max(0, KRONOS_ANON_MAX - eff.count);
}

export function resetsAt(counter: AnonCounter): string {
  const eff = effectiveCounter(counter);
  return new Date(eff.windowStart + KRONOS_ANON_WINDOW_MS).toISOString();
}

export function cookieOptions(): string {
  const prod = process.env.NODE_ENV === "production";
  const maxAge = Math.floor(KRONOS_ANON_WINDOW_MS / 1000);
  return [
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    prod ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function cookieHeader(counter: AnonCounter): string {
  return `${KRONOS_ANON_COOKIE}=${encodeCounter(counter)}; ${cookieOptions()}`;
}

/* ══════════════════════════════════════════
   In-memory IP + global rate limiting.
   Single-instance per Vercel serverless container — acceptable best-effort.
   ══════════════════════════════════════════ */

interface Bucket {
  count: number;
  windowStart: number;
}

type RegistryKey = "predict:ip" | "save:ip" | "candles:ip" | "predict:global";

interface Registry {
  predictIp: Map<string, Bucket>;
  saveIp: Map<string, Bucket>;
  candlesIp: Map<string, Bucket>;
  predictGlobal: Bucket;
  globalTrippedUntil: number;
}

type GlobalWithReg = typeof globalThis & {
  __kronosRateLimit?: Registry;
};

function registry(): Registry {
  const g = globalThis as GlobalWithReg;
  if (!g.__kronosRateLimit) {
    g.__kronosRateLimit = {
      predictIp: new Map(),
      saveIp: new Map(),
      candlesIp: new Map(),
      predictGlobal: { count: 0, windowStart: Date.now() },
      globalTrippedUntil: 0,
    };
  }
  return g.__kronosRateLimit;
}

/** Extract a best-effort client IP from Vercel / proxy headers. */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function hashIp(ip: string): string {
  return createHmac("sha256", secret()).update(ip).digest("base64url").slice(0, 22);
}

function bucketCheck(
  bucket: Bucket,
  now: number,
  windowMs: number,
  max: number,
): { allowed: boolean; remaining: number; resetsAt: number } {
  if (now - bucket.windowStart >= windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  const remaining = Math.max(0, max - bucket.count);
  return {
    allowed: bucket.count < max,
    remaining,
    resetsAt: bucket.windowStart + windowMs,
  };
}

export interface LimitResult {
  allowed: boolean;
  reason?: "ip_cap" | "global_cap";
  resetsAt?: string;
  remainingIp?: number;
  remainingGlobal?: number;
}

function mapKey(kind: RegistryKey, ip: string): string {
  return `${kind}:${hashIp(ip)}`;
}

/** Check (without bumping) whether a call would be allowed for this IP + global. */
export function checkPredictLimit(ip: string, now = Date.now()): LimitResult {
  const reg = registry();

  // Global trip flag (auto-reset once the trip window passes)
  if (reg.globalTrippedUntil > now) {
    return {
      allowed: false,
      reason: "global_cap",
      resetsAt: new Date(reg.globalTrippedUntil).toISOString(),
    };
  }

  const key = mapKey("predict:ip", ip);
  const ipBucket = reg.predictIp.get(key) ?? { count: 0, windowStart: now };
  const ipRes = bucketCheck(ipBucket, now, KRONOS_IP_WINDOW_MS, KRONOS_IP_MAX_PER_HOUR);
  reg.predictIp.set(key, ipBucket);

  const globalRes = bucketCheck(
    reg.predictGlobal,
    now,
    KRONOS_ANON_WINDOW_MS,
    KRONOS_GLOBAL_DAILY_CAP,
  );

  if (!ipRes.allowed) {
    return {
      allowed: false,
      reason: "ip_cap",
      resetsAt: new Date(ipRes.resetsAt).toISOString(),
      remainingIp: 0,
      remainingGlobal: globalRes.remaining,
    };
  }
  if (!globalRes.allowed) {
    // Trip the kill switch for the rest of the window
    reg.globalTrippedUntil = globalRes.resetsAt;
    return {
      allowed: false,
      reason: "global_cap",
      resetsAt: new Date(globalRes.resetsAt).toISOString(),
      remainingIp: ipRes.remaining,
      remainingGlobal: 0,
    };
  }

  return {
    allowed: true,
    remainingIp: ipRes.remaining,
    remainingGlobal: globalRes.remaining,
  };
}

export function bumpPredictLimit(ip: string): void {
  const reg = registry();
  const key = mapKey("predict:ip", ip);
  const ipBucket = reg.predictIp.get(key) ?? { count: 0, windowStart: Date.now() };
  ipBucket.count += 1;
  reg.predictIp.set(key, ipBucket);
  reg.predictGlobal.count += 1;
}

/** Status reporter — does not mutate. */
export function globalStatus(now = Date.now()): {
  tripped: boolean;
  resetsAt: string | null;
  remainingGlobal: number;
} {
  const reg = registry();
  if (reg.globalTrippedUntil > now) {
    return {
      tripped: true,
      resetsAt: new Date(reg.globalTrippedUntil).toISOString(),
      remainingGlobal: 0,
    };
  }
  const globalRes = bucketCheck(
    { ...reg.predictGlobal },
    now,
    KRONOS_ANON_WINDOW_MS,
    KRONOS_GLOBAL_DAILY_CAP,
  );
  return {
    tripped: false,
    resetsAt: null,
    remainingGlobal: globalRes.remaining,
  };
}

/** Check (and bump on allow) save endpoint by IP. */
export function checkAndBumpSaveLimit(
  ip: string,
  now = Date.now(),
): { allowed: boolean; resetsAt?: string } {
  const reg = registry();
  const key = mapKey("save:ip", ip);
  const bucket = reg.saveIp.get(key) ?? { count: 0, windowStart: now };
  const res = bucketCheck(bucket, now, KRONOS_IP_WINDOW_MS, KRONOS_SAVE_IP_MAX_PER_HOUR);
  if (!res.allowed) {
    reg.saveIp.set(key, bucket);
    return { allowed: false, resetsAt: new Date(res.resetsAt).toISOString() };
  }
  bucket.count += 1;
  reg.saveIp.set(key, bucket);
  return { allowed: true };
}

/** Check (and bump on allow) candles endpoint by IP. Protects the shared
 *  Twelve Data / Binance quotas from a single abusive client. */
export function checkAndBumpCandlesLimit(
  ip: string,
  now = Date.now(),
): { allowed: boolean; resetsAt?: string } {
  const reg = registry();
  const key = mapKey("candles:ip", ip);
  const bucket = reg.candlesIp.get(key) ?? { count: 0, windowStart: now };
  const res = bucketCheck(bucket, now, KRONOS_IP_WINDOW_MS, KRONOS_CANDLES_IP_MAX_PER_HOUR);
  if (!res.allowed) {
    reg.candlesIp.set(key, bucket);
    return { allowed: false, resetsAt: new Date(res.resetsAt).toISOString() };
  }
  bucket.count += 1;
  reg.candlesIp.set(key, bucket);
  return { allowed: true };
}

/* ── Input sanitization for saved comments ── */

const URL_REGEX = /\bhttps?:\/\/\S+|\bwww\.\S+|\b\S+\.(com|net|org|io|xyz|co|sh|dev|app|info|me|ru|cn|tv)\b/gi;
const COMMENT_MAX_LEN = 140;
const EMAIL_MAX_LEN = 254;
// Binance USDT pair (BTCUSDT) or Twelve Data ticker (AAPL, SPX, EUR/USD, XAU/USD, BRK-B, BRENT)
const SYMBOL_REGEX = /^[A-Z0-9./-]{1,15}$/;
const MAX_INPUT_CANDLES = 2048;
const MAX_PRED_CANDLES = 64;
const MAX_BODY_BYTES = 120_000;

export function sanitizeComment(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const stripped = raw.replace(URL_REGEX, "").replace(/\s+/g, " ").trim();
  if (!stripped) return null;
  return stripped.slice(0, COMMENT_MAX_LEN);
}

export function validateSaveInput(body: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  const size = Buffer.byteLength(JSON.stringify(body));
  if (size > MAX_BODY_BYTES) return { ok: false, error: "Payload too large" };

  if (typeof b.symbol !== "string" || !SYMBOL_REGEX.test(b.symbol)) {
    return { ok: false, error: "Invalid symbol" };
  }
  if (typeof b.timeframe !== "string" || b.timeframe.length > 10) {
    return { ok: false, error: "Invalid timeframe" };
  }
  if (typeof b.model !== "undefined" && (typeof b.model !== "string" || b.model.length > 10)) {
    return { ok: false, error: "Invalid model" };
  }
  if (typeof b.source !== "undefined" && b.source !== null) {
    if (typeof b.source !== "string" || (b.source !== "binance" && b.source !== "twelvedata")) {
      return { ok: false, error: "Invalid source" };
    }
  }
  if (typeof b.assetLabel !== "undefined" && b.assetLabel !== null) {
    if (typeof b.assetLabel !== "string" || b.assetLabel.length > 40) {
      return { ok: false, error: "Invalid assetLabel" };
    }
  }
  if (typeof b.email !== "undefined" && b.email !== null) {
    if (typeof b.email !== "string" || b.email.length > EMAIL_MAX_LEN) {
      return { ok: false, error: "Invalid email" };
    }
  }
  if (!Array.isArray(b.inputCandles) || b.inputCandles.length === 0 || b.inputCandles.length > MAX_INPUT_CANDLES) {
    return { ok: false, error: "Invalid input candles" };
  }
  if (!Array.isArray(b.predictedCandles) || b.predictedCandles.length === 0 || b.predictedCandles.length > MAX_PRED_CANDLES) {
    return { ok: false, error: "Invalid predicted candles" };
  }
  return { ok: true };
}
