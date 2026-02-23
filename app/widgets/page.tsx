"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const SUN =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="5.64" y1="5.64" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="18.36" y2="18.36"/><line x1="5.64" y1="18.36" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="18.36" y2="5.64"/></svg>';
const MOON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("hub-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hub-theme", next);
  }

  const q = query.trim().toLowerCase();
  const filtered = widgets.filter((w) => {
    if (!q) return true;
    const haystack =
      `${w.keywords} ${w.title} ${w.desc} ${w.tag}`.toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className={styles.page} data-theme={theme}>
      <div className={styles.toggleBar}>
        <button
          className={styles.toggleBtn}
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          dangerouslySetInnerHTML={{ __html: theme === "dark" ? SUN : MOON }}
        />
      </div>

      <div className={styles.wrapper}>
        <Link href="/" className={styles.backLink}>
          ← chamillion
        </Link>
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
