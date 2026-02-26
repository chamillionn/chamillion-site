"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import styles from "./page.module.css";

const widgets = [
  {
    slug: "orderbook-patatas",
    path: "post-01/orderbook-patatas",
    tag: "Mercados",
    title: "Libro de Órdenes",
    desc: "Simula cómo funciona un libro de órdenes con el mercado de patatas. Compra, vende y ve cómo se ejecutan las órdenes.",
    keywords:
      "libro de ordenes mercado patatas comprar vender ordenes limite spread",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><rect x="6" y="18" width="4" height="8" rx="1" fill="#4ade80"/><rect x="11" y="14" width="4" height="12" rx="1" fill="#4ade80" opacity="0.7"/><rect x="17" y="14" width="4" height="12" rx="1" fill="#f87171" opacity="0.7"/><rect x="22" y="10" width="4" height="16" rx="1" fill="#f87171"/></svg>',
  },
  {
    slug: "retail-vs-inst-esma",
    path: "post-01/retail-vs-inst-esma",
    tag: "Regulación · ESMA",
    title: "Retail vs Institucional",
    desc: "Visualización de datos ESMA sobre el coste comparado de inversores minoristas e institucionales en fondos europeos.",
    keywords:
      "retail institucional esma comisiones fondos inversion regulacion europa",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><circle cx="12" cy="16" r="6" stroke="#e8a87c" stroke-width="2" fill="none"/><circle cx="20" cy="16" r="6" stroke="#6b9ebb" stroke-width="2" fill="none"/></svg>',
  },
  {
    slug: "stablecoins-mcap",
    path: "post-01/stablecoins-mcap",
    tag: "Cripto · Stablecoins",
    title: "Stablecoins Market Cap",
    desc: "Gráfico de área con la evolución del market cap total de stablecoins desde 2017 hasta hoy.",
    keywords:
      "stablecoins market cap capitalización cripto grafico area usdt usdc tether",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><path d="M6 22C10 22 12 20 14 18C16 16 18 12 22 10C24 9 26 8" stroke="#82c4a0" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M6 22C10 22 12 20 14 18C16 16 18 12 22 10C24 9 26 8L26 26L6 26Z" fill="#82c4a0" opacity="0.15"/></svg>',
  },
  {
    slug: "compound-interest",
    path: "compound-interest",
    tag: "Finanzas · Educación",
    title: "Interés Compuesto",
    desc: "Calculadora interactiva para entender el interés compuesto. Compara carteras y simula volatilidad real.",
    keywords:
      "interes compuesto calculadora ahorro inversion rentabilidad volatilidad simulacion cartera",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><path d="M6 24C10 23 16 20 20 14 24 6 26 4" stroke="#6b9ebb" stroke-width="2.5" stroke-linecap="round" fill="none"/><line x1="6" y1="6" x2="6" y2="25" stroke="#555" stroke-width="1"/><line x1="5" y1="25" x2="26" y2="25" stroke="#555" stroke-width="1"/></svg>',
  },
];

export default function WidgetsPage() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = widgets.filter((w) => {
    if (!q) return true;
    const haystack =
      `${w.keywords} ${w.title} ${w.desc} ${w.tag}`.toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink}>
            ← chamillion
          </Link>
          <ThemeToggle />
        </div>
        <h1 className={styles.title}>Widgets</h1>
        <p className={styles.subtitle}>
          Componentes interactivos para la newsletter.
        </p>

        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            type="text"
            placeholder="Buscar componente..."
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.grid}>
          {filtered.map((w) => (
            <a
              key={w.slug}
              className={styles.card}
              href={`/widgets/${w.path}/index.html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.cardHeader}>
                <span
                  className={styles.cardIcon}
                  dangerouslySetInnerHTML={{ __html: w.icon }}
                />
                <div className={styles.cardTag}>{w.tag}</div>
              </div>
              <div className={styles.cardTitle}>{w.title}</div>
              <div className={styles.cardDesc}>{w.desc}</div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className={styles.noResults}>
            Sin resultados para esa búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
