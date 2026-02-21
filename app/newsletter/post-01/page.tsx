import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Post 01 — Chamillion",
  description:
    "Libro de órdenes, retail vs institucional (ESMA) y stablecoins market cap.",
};

const widgets = [
  {
    slug: "orderbook-patatas",
    title: "Libro de Órdenes — Mercado de Patatas",
    desc: "Simulación interactiva de un libro de órdenes. Compra, vende y observa cómo se ejecutan las órdenes.",
    height: 600,
  },
  {
    slug: "retail-vs-inst-esma",
    title: "Retail vs Institucional (ESMA)",
    desc: "Datos ESMA sobre comisiones: inversor minorista vs institucional en fondos europeos.",
    height: 700,
  },
  {
    slug: "stablecoins-mcap",
    title: "Stablecoins Market Cap",
    desc: "Evolución del market cap total de stablecoins desde 2017.",
    height: 500,
  },
];

export default function Post01() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        ← chamillion
      </Link>
      <h1 className={styles.title}>Post 01</h1>
      <p className={styles.subtitle}>
        Widgets interactivos del primer post de la newsletter.
      </p>

      {widgets.map((w) => (
        <section key={w.slug} className={styles.widget}>
          <h2 className={styles.widgetTitle}>{w.title}</h2>
          <p className={styles.widgetDesc}>{w.desc}</p>
          <iframe
            src={`/widgets/post-01/${w.slug}/index.html`}
            height={w.height}
            loading="lazy"
            className={styles.iframe}
          />
        </section>
      ))}
    </div>
  );
}
