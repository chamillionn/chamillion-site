/**
 * Shared validation helpers for server actions.
 */

/** Parses a FormData numeric field. Throws if missing or not a finite number. */
export function requireNumber(fd: FormData, key: string): number {
  const n = Number(fd.get(key));
  if (!Number.isFinite(n)) throw new Error(`${key} debe ser un número válido`);
  return n;
}

/** Parses a nullable numeric string. Returns null if empty or not a finite number. */
export function safeNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
