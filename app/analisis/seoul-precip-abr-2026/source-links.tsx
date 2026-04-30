import styles from "./source-links.module.css";

interface Props {
  polymarketUrl: string;
  kmaUrl: string;
}

/**
 * Pequeños iconos-link a las dos fuentes de verdad del análisis:
 *   • Polymarket (mercado de predicción)
 *   • KMA — Korean Meteorological Administration (estación 108 Seúl)
 *
 * Iconos SVG inline, sin dependencias externas. Un solo color que hereda
 * del contexto, hover en steel-blue, hairline border en reposo.
 */
export default function SourceLinks({ polymarketUrl, kmaUrl }: Props) {
  return (
    <span className={styles.sources}>
      <a
        href={polymarketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label="Abrir mercado en Polymarket"
        title="Polymarket"
      >
        <PolymarketGlyph />
      </a>
      <a
        href={kmaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label="Fuente: KMA · Korean Meteorological Administration"
        title="KMA — fuente del subyacente"
      >
        <KmaGlyph />
      </a>
    </span>
  );
}

function PolymarketGlyph() {
  return (
    <svg
      width="14"
      height="17"
      viewBox="0 0 43 53"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
    >
      <path d="M42.76 24.28V0L0 12.04v28.93l42.76 12.04V24.27zm-4.13-1.16V5.42L7.21 14.27zm-3.08 3.39L4.14 17.66v17.69l31.42-8.85zM7.21 38.75l31.42 8.85V29.89L7.21 38.74v.02z" />
    </svg>
  );
}

/** Cloud + tres gotas — fuente meteorológica genérica. */
function KmaGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 13.5a3.7 3.7 0 0 1 0-7.4 5 5 0 0 1 9.4 1.4h.5a3.2 3.2 0 0 1 0 6.4" />
      <path d="M9 17.5l-1 2.5 M13 17.5l-1 2.5 M17 17.5l-1 2.5" />
    </svg>
  );
}
