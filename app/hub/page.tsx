import styles from "./page.module.css";

const STATIONS = [
  {
    id: "cartera",
    label: "Cartera",
    desc: "Posiciones abiertas, historial de operaciones, rendimiento por estrategia y plataforma. Feed en tiempo real.",
    status: "en desarrollo",
    span: "wide",
  },
  {
    id: "herramientas",
    label: "Herramientas",
    desc: "Calculadoras, simuladores y widgets interactivos para análisis de inversiones.",
    status: "en desarrollo",
    span: "normal",
  },
  {
    id: "mi-cartera",
    label: "Mi Cartera",
    desc: "Conecta tus plataformas y wallets. Ve tus resultados con el mismo marco de análisis.",
    status: "planificado",
    span: "normal",
  },
  {
    id: "software",
    label: "Software",
    desc: "Robots, estrategias automatizadas y herramientas descargables.",
    status: "planificado",
    span: "normal",
  },
  {
    id: "consultorias",
    label: "Consultorías",
    desc: "Sesiones 1:1 para resolver dudas sobre tu cartera o estrategia de inversión.",
    status: "planificado",
    span: "normal",
  },
] as const;

function StatusDot({ status }: { status: string }) {
  const isActive = status === "en desarrollo";
  return (
    <span className={styles.status}>
      <span
        className={`${styles.dot} ${isActive ? styles.dotActive : styles.dotPlanned}`}
      />
      {status}
    </span>
  );
}

export default function HubOverview() {
  return (
    <div className={`page-transition ${styles.page}`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <h1 className={styles.title}>Centro de operaciones</h1>
        <p className={styles.subtitle}>
          Cada módulo se irá activando progresivamente. Eres de los primeros.
        </p>
      </header>

      {/* ── Station grid ── */}
      <div className={styles.grid}>
        {STATIONS.map((s, i) => (
          <article
            key={s.id}
            className={`${styles.station} ${s.span === "wide" ? styles.stationWide : ""}`}
            style={{ animationDelay: `${0.08 + i * 0.06}s` }}
          >
            <div className={styles.stationHeader}>
              <span className={styles.stationLabel}>{s.label}</span>
              <StatusDot status={s.status} />
            </div>
            <p className={styles.stationDesc}>{s.desc}</p>
          </article>
        ))}
      </div>

      {/* ── Footer line ── */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>
          chamillion.site/hub
        </span>
      </footer>
    </div>
  );
}
