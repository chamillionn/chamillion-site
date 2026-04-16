"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import { toggleWidgetPremium } from "./actions";
import styles from "./page.module.css";

type Widget = {
  slug: string;
  path: string;
  group?: string;
  groupTitle?: string;
  tag: string;
  title: string;
  desc: string;
  keywords: string;
  icon: string;
  private?: boolean;
};

const widgets: Widget[] = [
  {
    slug: "orderbook-patatas",
    path: "post-01/orderbook-patatas",
    group: "post-01",
    groupTitle: "El augurio de una odisea",
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
    group: "post-01",
    groupTitle: "El augurio de una odisea",
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
    group: "post-01",
    groupTitle: "El augurio de una odisea",
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
  {
    slug: "daily-compounder",
    path: "daily-compounder",
    tag: "Finanzas · Cripto",
    title: "Compounder Diario",
    desc: "Calculadora de compounding diario. Introduce un % de beneficio diario y visualiza el crecimiento exponencial.",
    keywords:
      "compounding diario calculadora beneficio rendimiento exponencial cripto trading daily",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><path d="M6 26C8 25 12 24 16 20 20 14 23 8 26 4" stroke="#82c4a0" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M6 26C8 25 12 24 16 20 20 14 23 8 26 4L26 26Z" fill="#82c4a0" opacity="0.15"/><line x1="6" y1="6" x2="6" y2="26" stroke="#555" stroke-width="1"/><line x1="5" y1="26" x2="26" y2="26" stroke="#555" stroke-width="1"/></svg>',
  },
  {
    slug: "value-axis",
    path: "post-02/value-axis",
    group: "post-02",
    groupTitle: "Cómo decir adiós a tu banco",
    tag: "Finanzas · Educación",
    title: "Con divisa vs Sin divisa",
    desc: "¿Por qué necesitamos dinero? Compara cómo funcionan los precios con una divisa común frente al trueque directo. Interactivo.",
    keywords: "dinero divisa valor precio trueque intercambio euro pan corte cena referencia barter",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><line x1="16" y1="6" x2="16" y2="26" stroke="#6b9ebb" stroke-width="1" opacity="0.3"/><circle cx="8" cy="10" r="2.5" fill="#e8a840"/><circle cx="8" cy="18" r="2.5" fill="#6b9ebb"/><circle cx="8" cy="24" r="2.5" fill="#4ade80"/><line x1="10.5" y1="10" x2="16" y2="10" stroke="#e8a840" stroke-width="1" opacity="0.4"/><line x1="10.5" y1="18" x2="16" y2="18" stroke="#6b9ebb" stroke-width="1" opacity="0.4"/><line x1="10.5" y1="24" x2="16" y2="24" stroke="#4ade80" stroke-width="1" opacity="0.4"/><circle cx="24" cy="10" r="2" stroke="#e8a840" stroke-width="1" fill="none"/><circle cx="27" cy="18" r="2" stroke="#6b9ebb" stroke-width="1" fill="none"/><circle cx="21" cy="22" r="2" stroke="#4ade80" stroke-width="1" fill="none"/><line x1="24" y1="12" x2="27" y2="16" stroke="#555" stroke-width="0.7"/><line x1="27" y1="20" x2="21" y2="20" stroke="#555" stroke-width="0.7"/><line x1="21" y1="20" x2="24" y2="12" stroke="#555" stroke-width="0.7"/></svg>',
  },
  {
    slug: "eur-value",
    path: "post-02/eur-value",
    group: "post-02",
    groupTitle: "Cómo decir adiós a tu banco",
    tag: "Finanzas · Educación",
    title: "Valor del Euro",
    desc: "El euro es un activo más. Su valor fluctúa, y con él el precio de todo lo demás.",
    keywords: "euro divisa valor fluctuación precio inflación deflación cotización pan corte cena",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><path d="M6 20 L10 18 L14 21 L18 14 L22 16 L26 10" stroke="#4ade80" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="6" y1="16" x2="26" y2="16" stroke="#555" stroke-width="0.5" stroke-dasharray="2 2"/><text x="16" y="28" text-anchor="middle" font-size="6" fill="#6b9ebb" font-family="serif">€</text></svg>',
  },
  {
    slug: "evm-chains",
    path: "post-02/evm-chains",
    group: "post-02",
    groupTitle: "Cómo decir adiós a tu banco",
    tag: "Cripto · Blockchain",
    title: "EVM Chains",
    desc: "Comparativa interactiva de las principales redes EVM: Ethereum, Arbitrum, Base, Polygon, Optimism y HyperEVM con TVL y protocolos DeFi.",
    keywords: "ethereum arbitrum optimism polygon base hyperevm evm blockchain tvl defi protocolos comparativa",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><circle cx="10" cy="12" r="4" stroke="#627EEA" stroke-width="1.5" fill="none"/><circle cx="22" cy="12" r="4" stroke="#28A0F0" stroke-width="1.5" fill="none"/><circle cx="10" cy="22" r="4" stroke="#8247E5" stroke-width="1.5" fill="none"/><circle cx="22" cy="22" r="4" stroke="#FF0420" stroke-width="1.5" fill="none"/></svg>',
  },
  {
    slug: "blockchain-anim",
    path: "post-02/blockchain-anim",
    group: "post-02",
    groupTitle: "Cómo decir adiós a tu banco",
    tag: "Cripto · Blockchain",
    title: "Blockchain en vivo",
    desc: "Animación de una cadena de bloques formándose en tiempo real. Bloques pendientes, transacciones entrantes y confirmaciones.",
    keywords:
      "blockchain bloques cadena ethereum transacciones confirmacion animacion defi cripto",
    icon: '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><rect x="4" y="12" width="7" height="8" rx="2" stroke="#6b9ebb" stroke-width="1.5"/><rect x="13" y="12" width="7" height="8" rx="2" stroke="#6b9ebb" stroke-width="1.5"/><rect x="22" y="12" width="6" height="8" rx="2" stroke="#6b9ebb" stroke-width="1.5" opacity="0.4" stroke-dasharray="2 2"/><line x1="11" y1="16" x2="13" y2="16" stroke="#6b9ebb" stroke-width="1.5"/><line x1="20" y1="16" x2="22" y2="16" stroke="#6b9ebb" stroke-width="1.5" opacity="0.4"/></svg>',
  },
];

interface Props {
  premiumSlugs: string[];
  userRole: "free" | "member" | "admin" | null;
}

export default function WidgetsClient({ premiumSlugs, userRole }: Props) {
  const [query, setQuery] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pending, startTransition] = useTransition();
  const [localPremium, setLocalPremium] = useState<string[]>(premiumSlugs);

  const isAdmin = userRole === "admin";
  const canAccess = userRole === "member" || userRole === "admin";

  const copyEmbed = useCallback((e: React.MouseEvent, w: Widget) => {
    e.preventDefault();
    e.stopPropagation();
    const snippet = `<iframe src="https://chamillion.site/widgets/${w.path}/index.html" width="100%" height="500" frameborder="0" loading="lazy"></iframe>`;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedSlug(w.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  }, []);

  function handleTogglePremium(slug: string) {
    // Optimistic update
    setLocalPremium((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    startTransition(() => toggleWidgetPremium(slug));
  }

  const q = query.trim().toLowerCase();
  const filtered = widgets.filter((w) => {
    if (w.private && !isAdmin) return false;
    if (!q) return true;
    const haystack =
      `${w.keywords} ${w.title} ${w.desc} ${w.tag} ${w.groupTitle ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });

  // Group widgets: ungrouped first, then each group in order
  const ungrouped = filtered.filter((w) => !w.group);
  const groupOrder: string[] = [];
  const groups: Record<string, typeof filtered> = {};
  filtered.forEach((w) => {
    if (!w.group) return;
    if (!groups[w.group]) {
      groups[w.group] = [];
      groupOrder.push(w.group);
    }
    groups[w.group].push(w);
  });

  const renderCard = (w: Widget) => {
    const isPremium = localPremium.includes(w.slug);
    const locked = isPremium && !canAccess;

    const card = (
      <div
        key={w.slug}
        className={`${styles.card} ${locked ? styles.cardLocked : ""}`}
      >
        <div className={styles.cardHeader}>
          <span
            className={styles.cardIcon}
            dangerouslySetInnerHTML={{ __html: w.icon }}
          />
          <div className={styles.cardTag}>{w.tag}</div>
          {isPremium && <span className={styles.premiumBadge}>Premium</span>}
          {w.private && <span className={styles.adminBadge}>privado</span>}
        </div>
        <div className={styles.cardTitle}>{w.title}</div>
        <div className={styles.cardDesc}>{w.desc}</div>

        {locked ? (
          <Link
            href="/suscribirse"
            className={styles.lockedHint}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Suscríbete para acceder
          </Link>
        ) : (
          <button
            className={styles.embedBtn}
            onClick={(e) => copyEmbed(e, w)}
            title="Copiar código para embeber"
          >
            {copiedSlug === w.slug ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            )}
            {copiedSlug === w.slug ? "Copiado" : "Embeber"}
          </button>
        )}

        {/* Admin edit mode: toggle premium */}
        {editMode && isAdmin && (
          <button
            className={`${styles.togglePremium} ${isPremium ? styles.togglePremiumActive : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTogglePremium(w.slug);
            }}
            disabled={pending}
          >
            {isPremium ? "Quitar Premium" : "Hacer Premium"}
          </button>
        )}
      </div>
    );

    // Wrap in link only if not locked and not in edit mode
    if (locked || editMode) return card;

    return (
      <a
        key={w.slug}
        className={styles.cardLink}
        href={`/widgets/${w.path}/index.html`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {card}
      </a>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink}>
            ← chamillion
          </Link>
          <div className={styles.topBarRight}>
            {isAdmin && (
              <button
                className={`${styles.editToggle} ${editMode ? styles.editToggleActive : ""}`}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? "Salir de edición" : "Editar"}
              </button>
            )}
            <ThemeToggle />
          </div>
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

        {ungrouped.length > 0 && (
          <div className={styles.grid}>
            {ungrouped.map(renderCard)}
          </div>
        )}

        {groupOrder.map((gid) => (
          <div key={gid} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupLabel}>Newsletter</span>
              <span className={styles.groupTitle}>{groups[gid][0].groupTitle}</span>
            </div>
            <div className={styles.grid}>
              {groups[gid].map(renderCard)}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className={styles.noResults}>
            Sin resultados para esa búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
