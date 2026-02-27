/**
 * CSS variable references for the global theme palette.
 * Values resolve at runtime via globals.css custom properties.
 */
export const V = {
  steel: "var(--steel-blue)",
  steelRgb: "var(--steel-blue-rgb)",
  bgDark: "var(--bg-dark)",
  bgCard: "var(--bg-card)",
  bgCardRgb: "var(--bg-card-rgb)",
  bgCardHover: "var(--bg-card-hover)",
  border: "var(--border)",
  borderRgb: "var(--border-rgb)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  green: "var(--green)",
  red: "var(--red)",
  gold: "var(--gold)",
  goldRgb: "var(--gold-rgb)",
  shadowDropdown: "var(--shadow-dropdown)",
} as const;

export function steelA(a: number) {
  return `rgba(${V.steelRgb}, ${a})`;
}

export function bgCardA(a: number) {
  return `rgba(${V.bgCardRgb}, ${a})`;
}
