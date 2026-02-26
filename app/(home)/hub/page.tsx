"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import styles from "./page.module.css";

const FEATURES = [
  {
    icon: "M3 3v18h18M7 16l4-4 4 4 5-5",
    title: "Cartera a tiempo real",
    desc: "Posiciones, estrategias en curso, plataformas y rendimiento al detalle.",
  },
  {
    icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5a2 2 0 0 1 2-2h14v14H6.5A2.5 2.5 0 0 0 4 19.5z",
    title: "Newsletter extendida",
    desc: "Versiones ampliadas con elementos interactivos y datos en vivo.",
  },
  {
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    title: "Mapa de conocimientos",
    desc: "Artículos, glosario y fundamentos de cada estrategia y plataforma.",
  },
  {
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    title: "Comunidad",
    desc: "Espacios de discusi\u00f3n directos para ideas y preguntas.",
  },
];

function BgCanvas() {
  return (
    <div className={styles.bgCanvas} aria-hidden="true">
      {/* Grid */}
      <svg className={styles.bgGrid} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {[60, 120, 180, 240].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />
        ))}
        {[80, 160, 240, 320].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" />
        ))}
      </svg>

      {/* Candlesticks */}
      <svg className={styles.bgCandles} viewBox="0 0 280 200" preserveAspectRatio="xMidYMid meet">
        {/* Axis */}
        <line className={styles.bgAxis} x1="40" y1="20" x2="40" y2="180" />
        <line className={styles.bgAxis} x1="40" y1="180" x2="260" y2="180" />

        {/* Candle wicks + bodies */}
        {[
          { x: 70, wick: [55, 130], body: [70, 120], up: false },
          { x: 105, wick: [40, 110], body: [50, 90], up: true },
          { x: 140, wick: [30, 105], body: [45, 85], up: true },
          { x: 175, wick: [50, 130], body: [60, 115], up: false },
          { x: 210, wick: [35, 100], body: [45, 80], up: true },
          { x: 245, wick: [25, 90], body: [35, 75], up: true },
        ].map((c, i) => (
          <g key={i} className={styles.bgCandle} style={{ animationDelay: `${0.8 + i * 0.4}s` }}>
            <line x1={c.x} y1={c.wick[0]} x2={c.x} y2={c.wick[1]} className={styles.bgWick} />
            <rect
              x={c.x - 10}
              y={c.body[0]}
              width="20"
              height={c.body[1] - c.body[0]}
              rx="2"
              className={c.up ? styles.bgBodyUp : styles.bgBodyDown}
            />
          </g>
        ))}

        {/* Trend line */}
        <polyline
          className={styles.bgTrend}
          points="70,95 105,70 140,65 175,88 210,62 245,55"
          fill="none"
        />
      </svg>

      {/* Donut chart — asset allocation */}
      <svg className={styles.bgDonut} viewBox="0 0 120 120">
        <circle className={styles.bgDonutTrack} cx="60" cy="60" r="45" />
        <circle className={styles.bgDonutArc1} cx="60" cy="60" r="45" />
        <circle className={styles.bgDonutArc2} cx="60" cy="60" r="45" />
        <circle className={styles.bgDonutArc3} cx="60" cy="60" r="45" />
      </svg>

      {/* Area chart — bottom right */}
      <svg className={styles.bgArea} viewBox="0 0 300 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--steel-blue)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--steel-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className={styles.bgAreaFill}
          d="M0,90 C30,85 50,70 80,65 C110,60 130,75 160,55 C190,35 220,45 250,30 C270,22 290,25 300,20 L300,120 L0,120Z"
          fill="url(#areaFill)"
        />
        <path
          className={styles.bgAreaLine}
          d="M0,90 C30,85 50,70 80,65 C110,60 130,75 160,55 C190,35 220,45 250,30 C270,22 290,25 300,20"
          fill="none"
        />
      </svg>
    </div>
  );
}

export default function HubPage() {
  return (
    <div className={`page-transition ${styles.page}`}>
      <BgCanvas />
      {/* HEADER */}
      <header className={styles.header}>
        <Link className={styles.logoLink} href="/">
          <div className={styles.logoBox}>
            <Image
              src="/assets/newsletter/logo.jpg"
              alt="Chamillion"
              width={24}
              height={24}
            />
          </div>
          <span className={styles.logoText}>Chamillion</span>
        </Link>
        <nav className={styles.headerNav}>
          <Link href="/">Inicio</Link>
          <Link href="/newsletter">Newsletter</Link>
          <ThemeToggle />
        </nav>
      </header>

      {/* CONTENT */}
      <main className={styles.main}>
        <div className={styles.heroBlock}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            En construcci&oacute;n
          </span>

          <h1 className={styles.heading}>
            Hub
          </h1>

          <p className={styles.lead}>
            La base de operaciones de Chamillion.
            <br />
            Todo lo que necesitas para seguir el trayecto, en un solo sitio.
          </p>
        </div>

        <div className={styles.divider} />

        <div className={styles.features}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.feature}>
              <div className={styles.featureIconWrap}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={f.icon} />
                </svg>
              </div>
              <div className={styles.featureText}>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.closing}>
          <p className={styles.closingQuote}>Pr&oacute;ximamente.</p>
          <p className={styles.closingHint}>
            Mientras tanto, la newsletter es el mejor sitio para seguir cada paso.
          </p>
          <div className={styles.closingLinks}>
            <Link href="/newsletter" className={styles.primaryLink}>
              Ir a la Newsletter
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link href="/" className={styles.secondaryLink}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
