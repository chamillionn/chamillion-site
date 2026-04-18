"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Spinner from "@/components/spinner";
import ErrorBox from "@/components/error-box";
import {
  computeAPR,
  daysUntil,
  formatDays,
  formatPercent,
  formatUSDC,
  parsePolymarketUrl,
  type Orderbook,
  type OrderLevel,
  type ResolvedMarket,
  type SearchResult,
} from "@/lib/polymarket-api";
import styles from "./prediction-analyzer.module.css";

type Side = "YES" | "NO";

export default function PredictionAnalyzerClient() {
  const [input, setInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [market, setMarket] = useState<ResolvedMarket | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [side, setSide] = useState<Side>("YES");
  const [entryPrice, setEntryPrice] = useState("");

  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [orderbookLoading, setOrderbookLoading] = useState(false);
  const [orderbookError, setOrderbookError] = useState("");

  const selectedOutcome = useMemo(
    () => market?.outcomes.find((o) => o.id === selectedOutcomeId) ?? null,
    [market, selectedOutcomeId],
  );

  const tokenId = useMemo(() => {
    if (!selectedOutcome) return null;
    return side === "YES" ? selectedOutcome.yesTokenId : selectedOutcome.noTokenId;
  }, [selectedOutcome, side]);

  const daysRemaining = useMemo(
    () => daysUntil(selectedOutcome?.endDate ?? market?.endDate ?? null),
    [selectedOutcome, market],
  );

  const isExpired = daysRemaining <= 0;

  const parsedPrice = Number(entryPrice);
  const apr = useMemo(
    () => computeAPR({ entryPrice: parsedPrice, daysRemaining }),
    [parsedPrice, daysRemaining],
  );

  /* ── Market lookup ────────────────────────── */

  const loadMarket = useCallback(async (slug: string) => {
    setMarketLoading(true);
    setMarketError("");
    setMarket(null);
    setSelectedOutcomeId(null);
    setEntryPrice("");
    setOrderbook(null);
    setOrderbookError("");
    try {
      const res = await fetch(`/api/polymarket/market?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok) {
        setMarketError(
          data?.error === "NOT_FOUND"
            ? "No se encontró el mercado."
            : "Error cargando el mercado.",
        );
        return;
      }
      const resolved = data.market as ResolvedMarket;
      setMarket(resolved);
      const firstLive =
        resolved.outcomes.find((o) => daysUntil(o.endDate) > 0 && !o.closed) ??
        resolved.outcomes[0];
      if (firstLive) setSelectedOutcomeId(firstLive.id);
    } catch {
      setMarketError("Error de conexión.");
    } finally {
      setMarketLoading(false);
    }
  }, []);

  /* ── Search or URL submit ─────────────────── */

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const raw = input.trim();
      if (!raw) return;
      setSearchError("");
      setSearchResults(null);

      const slug = parsePolymarketUrl(raw);
      if (slug) {
        await loadMarket(slug);
        return;
      }
      if (raw.length < 2) {
        setSearchError("Escribe al menos 2 caracteres.");
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/polymarket/search?q=${encodeURIComponent(raw)}`);
        const data = await res.json();
        if (!res.ok) {
          setSearchError("Error en la búsqueda.");
          return;
        }
        setSearchResults(data.results as SearchResult[]);
      } catch {
        setSearchError("Error de conexión.");
      } finally {
        setSearchLoading(false);
      }
    },
    [input, loadMarket],
  );

  /* ── Orderbook fetch ──────────────────────── */

  const fetchOrderbook = useCallback(async (token: string) => {
    setOrderbookLoading(true);
    setOrderbookError("");
    try {
      const res = await fetch(`/api/polymarket/orderbook?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) {
        setOrderbookError("No se pudo cargar el orderbook.");
        return;
      }
      setOrderbook(data.orderbook as Orderbook);
    } catch {
      setOrderbookError("Error de conexión.");
    } finally {
      setOrderbookLoading(false);
    }
  }, []);

  // Auto-load orderbook whenever outcome or side changes. Skip when the
  // selected outcome has already resolved — there's no live book and the
  // request would just return empty.
  useEffect(() => {
    if (!tokenId || isExpired) {
      setOrderbook(null);
      setOrderbookError("");
      return;
    }
    fetchOrderbook(tokenId);
    setEntryPrice("");
  }, [tokenId, isExpired, fetchOrderbook]);

  /* ── Render ───────────────────────────────── */

  const bestAsk = orderbook?.asks[0]?.price;
  const bestBid = orderbook?.bids[0]?.price;
  const spread =
    typeof bestAsk === "number" && typeof bestBid === "number"
      ? bestAsk - bestBid
      : null;

  return (
    <div className={`page-transition ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Prediction Analyzer</h1>
        <p className={styles.subtitle}>
          Calcula el APR estimado de una posición en Polymarket según el precio
          de entrada y la fecha de resolución del mercado.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buscar por título o pegar link de Polymarket…"
          className={styles.searchInput}
          autoComplete="off"
        />
        <button type="submit" className={styles.searchBtn} disabled={searchLoading || marketLoading}>
          {searchLoading || marketLoading ? <Spinner /> : "Buscar"}
        </button>
      </form>

      {searchError && <ErrorBox>{searchError}</ErrorBox>}
      {marketError && <ErrorBox>{marketError}</ErrorBox>}

      {searchResults && searchResults.length === 0 && !marketLoading && (
        <p className={styles.muted}>Sin resultados.</p>
      )}

      {searchResults && searchResults.length > 0 && !market && (
        <ul className={styles.resultsList}>
          {searchResults.map((r) => (
            <li key={r.slug}>
              <button
                type="button"
                className={styles.resultItem}
                onClick={() => {
                  setSearchResults(null);
                  loadMarket(r.slug);
                }}
              >
                {r.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.icon}
                    alt=""
                    className={styles.resultIcon}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className={styles.resultIconFallback} aria-hidden="true" />
                )}
                <div className={styles.resultBody}>
                  <span className={styles.resultQuestion}>{r.question}</span>
                  <span className={styles.resultMeta}>
                    {r.endDate
                      ? `Resuelve ${new Date(r.endDate).toLocaleDateString("es-ES")}`
                      : "Sin fecha"}
                    {typeof r.volume === "number" && r.volume > 0 && (
                      <>
                        <span className={styles.metaSep}>·</span>
                        <span>Vol ${formatVolume(r.volume)}</span>
                      </>
                    )}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {marketLoading && (
        <p className={styles.muted}>
          <Spinner /> Cargando mercado…
        </p>
      )}

      {market && (
        <div className={styles.layout}>
        <section className={styles.marketPanel}>
          <div className={styles.marketHead}>
            {(() => {
              const img = selectedOutcome?.icon || market.image || market.icon || null;
              return img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  className={styles.marketImage}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className={styles.marketImageFallback} aria-hidden="true" />
              );
            })()}
            <div className={styles.marketHeadBody}>
              <span className={styles.marketKicker}>
                {market.type === "event" ? "Evento · Multi-opción" : "Mercado binario"}
              </span>
              <h2 className={styles.marketTitle}>{market.title}</h2>
              <div className={styles.marketMeta}>
                <span>
                  Resuelve:{" "}
                  <strong>
                    {market.endDate
                      ? new Date(market.endDate).toLocaleString("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </strong>
                </span>
                <span className={styles.metaSep}>·</span>
                <span>{formatDays(daysRemaining)} restantes</span>
                {market.closed && <span className={styles.badgeClosed}>Cerrado</span>}
              </div>
            </div>
          </div>

          {(selectedOutcome?.description || market.description) && (
            <details className={styles.rulesPanel}>
              <summary className={styles.rulesSummary}>
                <span className={styles.rulesLabel}>
                  <svg
                    className={styles.rulesIcon}
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 2.5h7L13 5.5v8A0.5 0.5 0 0 1 12.5 14h-9A0.5 0.5 0 0 1 3 13.5v-11A0.5 0.5 0 0 1 3.5 2z" />
                    <path d="M10 2.5v3h3" />
                    <path d="M5.5 8.5h5M5.5 11h4" />
                  </svg>
                  Reglas de resolución
                </span>
                <svg
                  className={styles.rulesChevron}
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </summary>
              <div className={styles.rulesContent}>
                {selectedOutcome?.description || market.description}
              </div>
            </details>
          )}

          <div className={styles.controlsRow}>
            {market.outcomes.length > 1 && (
              <div className={styles.field}>
                <label className={styles.label}>Opción</label>
                <select
                  className={styles.select}
                  value={selectedOutcomeId ?? ""}
                  onChange={(e) => setSelectedOutcomeId(e.target.value)}
                >
                  {market.outcomes.map((o) => {
                    const expired = daysUntil(o.endDate) <= 0 || o.closed;
                    return (
                      <option key={o.id} value={o.id} disabled={expired}>
                        {o.title}
                        {expired ? " · expirado" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Posición</label>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={`${styles.segment} ${side === "YES" ? styles.segmentActive : ""}`}
                  onClick={() => setSide("YES")}
                >
                  YES
                </button>
                <button
                  type="button"
                  className={`${styles.segment} ${side === "NO" ? styles.segmentActive : ""}`}
                  onClick={() => setSide("NO")}
                >
                  NO
                </button>
              </div>
            </div>
          </div>

          <div className={styles.bookCluster}>
            <div className={styles.orderbookHead}>
              <label className={styles.label}>Orderbook · {side}</label>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={() => tokenId && fetchOrderbook(tokenId)}
                disabled={!tokenId || orderbookLoading || isExpired}
                aria-label="Refrescar orderbook"
                title="Refrescar orderbook"
              >
                {orderbookLoading ? (
                  <Spinner />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89" />
                    <path d="M13.5 2.5v3h-3" />
                  </svg>
                )}
              </button>
            </div>
            {isExpired ? (
              <div className={styles.expiredNotice}>
                <strong>Esta opción ya ha resuelto</strong>
                <span>
                  {selectedOutcome?.endDate
                    ? `Fecha: ${new Date(selectedOutcome.endDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}`
                    : "El mercado no está activo."}
                  {market.outcomes.length > 1 && " Selecciona otra opción del desplegable."}
                </span>
              </div>
            ) : (
              <>
                {orderbookError && <ErrorBox>{orderbookError}</ErrorBox>}
                {!tokenId && !orderbookError && (
                  <p className={styles.muted}>Token no disponible para este outcome.</p>
                )}
                {tokenId && orderbook && (
                  <OrderbookView
                    book={orderbook}
                    onSelect={(price) => setEntryPrice(price.toFixed(3))}
                    spread={spread}
                  />
                )}
              </>
            )}
            <div className={styles.priceInline}>
              <label className={styles.labelInline} htmlFor="entry-price">
                Precio
              </label>
              <input
                id="entry-price"
                type="number"
                step="0.001"
                min="0.001"
                max="0.999"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.000"
                className={styles.priceInput}
                inputMode="decimal"
                disabled={isExpired}
              />
              <span className={styles.priceHint}>
                {isExpired ? "—" : "o clicka un nivel del orderbook"}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.result}>
            <div className={styles.resultHeading}>
              <span className={styles.resultDot} aria-hidden="true" />
              APR estimado
            </div>
            <div className={styles.resultApr}>{formatPercent(apr.apr, 1)}</div>
            <div className={styles.resultGrid}>
              <div>
                <div className={styles.resultKey}>Return bruto</div>
                <div className={styles.resultVal}>{formatPercent(apr.returnMultiple, 2)}</div>
              </div>
              <div>
                <div className={styles.resultKey}>Días restantes</div>
                <div className={styles.resultVal}>{formatDays(daysRemaining)}</div>
              </div>
              <div>
                <div className={styles.resultKey}>Por 100 USDC</div>
                <div className={styles.resultVal}>
                  {apr.valid ? formatUSDC(apr.profitPer100) : "—"}
                </div>
              </div>
            </div>
            {isExpired ? (
              <p className={styles.resultHint}>
                Esta opción ya ha resuelto.
                {market.outcomes.length > 1 && " Escoge una opción activa para calcular el APR."}
              </p>
            ) : !apr.valid && parsedPrice > 0 ? (
              <p className={styles.resultHint}>
                {parsedPrice >= 1 || parsedPrice <= 0
                  ? "El precio debe estar entre 0 y 1."
                  : "El mercado está por resolver."}
              </p>
            ) : !parsedPrice ? (
              <p className={styles.resultHint}>
                Introduce un precio o clicka un nivel del orderbook.
              </p>
            ) : null}
        </section>
        </div>
      )}
    </div>
  );
}

/* ─── Orderbook view ────────────────────────────────── */

function OrderbookView({
  book,
  onSelect,
  spread,
}: {
  book: Orderbook;
  onSelect: (price: number) => void;
  spread: number | null;
}) {
  const asks = book.asks.slice(0, 5).reverse(); // show far → near, near sits on top of spread
  const bids = book.bids.slice(0, 5);
  const maxSize = Math.max(
    1,
    ...asks.map((l) => l.size),
    ...bids.map((l) => l.size),
  );

  const renderRow = (lvl: OrderLevel, side: "ask" | "bid", i: number) => (
    <button
      key={`${side}-${i}`}
      type="button"
      className={`${styles.obRow} ${side === "ask" ? styles.obAsk : styles.obBid}`}
      onClick={() => onSelect(lvl.price)}
      style={{ ["--depth" as string]: `${(lvl.size / maxSize) * 100}%` } as React.CSSProperties}
    >
      <span className={styles.obPrice}>{lvl.price.toFixed(3)}</span>
      <span className={styles.obSize}>{formatSize(lvl.size)}</span>
    </button>
  );

  return (
    <div className={styles.orderbook}>
      <div className={styles.obHeader}>
        <span>Precio</span>
        <span>Tamaño</span>
      </div>
      <div className={styles.obSide}>
        {asks.length === 0 ? (
          <div className={styles.obEmpty}>Sin asks</div>
        ) : (
          asks.map((lvl, i) => renderRow(lvl, "ask", i))
        )}
      </div>
      <div className={styles.obSpread}>
        {spread !== null ? `Spread ${(spread * 100).toFixed(1)}¢` : "—"}
      </div>
      <div className={styles.obSide}>
        {bids.length === 0 ? (
          <div className={styles.obEmpty}>Sin bids</div>
        ) : (
          bids.map((lvl, i) => renderRow(lvl, "bid", i))
        )}
      </div>
    </div>
  );
}

function formatSize(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(n < 100 ? 1 : 0);
}

function formatVolume(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toFixed(0);
}
