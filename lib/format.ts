/**
 * Formatters for monetary values and percentages used across analysis dashboards.
 * Single-source-of-truth — earlier we shipped two formatters with different unit
 * conventions on the same UI surface and the same data flowed through both,
 * which produced -833% PnL displays. Don't repeat that.
 *
 * Conventions:
 *   - `fmtUsd(n)`        → n in dollars (e.g. 1.55 → "+$1.55")
 *   - `fmtPctRaw(p)`     → p in percent units (e.g. -8.33 → "−8.3%")
 *   - `fmtPctRatio(r)`   → r as ratio (e.g. -0.0833 → "−8.3%")
 */

const MINUS = "−"; // U+2212, typographically correct minus

export function fmtUsd(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? MINUS : n > 0 ? "+" : "";
  return `${sign}$${Math.abs(n).toFixed(digits)}`;
}

export function fmtPctRaw(percent: number, digits = 1): string {
  if (!Number.isFinite(percent)) return "—";
  const sign = percent >= 0 ? "+" : MINUS;
  return `${sign}${Math.abs(percent).toFixed(digits)}%`;
}

export function fmtPctRatio(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return fmtPctRaw(ratio * 100, digits);
}

export function fmtVolume(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toFixed(0)}`;
}
