import Link from "next/link";
import styles from "./herramientas.module.css";

const TOOLS = [
  {
    slug: "kronos",
    href: "/hub/herramientas/kronos",
    label: "Kronos",
    tag: "IA · Predicción",
    desc: "Motor de predicción de velas financieras. Selecciona un activo y timeframe, y Kronos proyecta las próximas velas usando inteligencia artificial.",
    status: "activo",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    slug: "prediction-analyzer",
    href: "/hub/herramientas/prediction-analyzer",
    label: "Prediction Analyzer",
    tag: "Polymarket · APR",
    desc: "Calcula el APR estimado de una posición en un mercado de Polymarket según el precio de entrada y la fecha de resolución.",
    status: "activo",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/></svg>`,
  },
] as const;

function StatusIndicator({ status }: { status: string }) {
  return (
    <span className={styles.status}>
      <span
        className={`${styles.dot} ${status === "activo" ? styles.dotActive : styles.dotPlanned}`}
      />
      {status}
    </span>
  );
}

export const metadata = { title: "Herramientas" };

export default function HerramientasPage() {
  return (
    <div className={`page-transition ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Herramientas</h1>
        <p className={styles.subtitle}>
          Instrumentos de análisis para tus inversiones.
        </p>
      </header>

      <div className={styles.grid}>
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className={styles.tool}
          >
            <div className={styles.toolTop}>
              <span
                className={styles.toolIcon}
                dangerouslySetInnerHTML={{ __html: tool.icon }}
              />
              <div className={styles.toolMeta}>
                <span className={styles.toolLabel}>{tool.label}</span>
                <span className={styles.toolTag}>{tool.tag}</span>
              </div>
              <StatusIndicator status={tool.status} />
            </div>
            <p className={styles.toolDesc}>{tool.desc}</p>
            <span className={styles.toolArrow}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
              Abrir
            </span>
          </Link>
        ))}
      </div>

    </div>
  );
}
