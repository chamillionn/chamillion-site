import type { PositionRow } from "./types";

/**
 * Safe parseFloat that returns null instead of NaN.
 * Covers: undefined, null, empty string, non-numeric strings.
 */
export function safeFloat(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate a PositionRow before DB insert/update.
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePositionRow(row: PositionRow): string | null {
  if (!row.asset || row.asset.trim() === "") {
    return "empty asset name";
  }
  if (!Number.isFinite(row.size) || row.size === 0) {
    return `invalid size for ${row.asset}: ${row.size}`;
  }
  if (!Number.isFinite(row.cost_basis)) {
    return `invalid cost_basis for ${row.asset}: ${row.cost_basis}`;
  }
  if (!Number.isFinite(row.current_value)) {
    return `invalid current_value for ${row.asset}: ${row.current_value}`;
  }
  return null;
}

/**
 * Validate HTTP response before parsing JSON.
 * Throws a descriptive error on non-OK status.
 */
export function assertOk(res: Response, context: string): void {
  if (!res.ok) {
    throw new Error(`${context}: HTTP ${res.status} ${res.statusText}`);
  }
}
