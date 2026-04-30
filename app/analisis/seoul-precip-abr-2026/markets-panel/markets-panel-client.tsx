"use client";

import { useState } from "react";
import OrderbookPanel from "./orderbook-panel";
import { fmtUsd, fmtPctRaw, fmtPctRatio, fmtVolume } from "@/lib/format";
import styles from "./markets-panel.module.css";

export interface SrEntry {
  range: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  yesTokenId: string | null;
  noTokenId: string | null;
  position: {
    side: "yes" | "no";
    size: number;
    avgPrice: number;
    /** Live mid (best_bid + best_ask)/2 from the held side's orderbook. */
    curPrice: number | null;
    cashPnl: number;
    /** Already in percent units, e.g. -8.33 = -8.33%. */
    pnlPct: number;
  } | null;
}

interface Props {
  entries: SrEntry[];
  mtdMm: number;
  /** Upper bound of the implied distribution (mm). Used to project "X+" buckets. */
  stripMax: number;
  totalCashPnl: number | null;
  totalNotional: number | null;
  fetchedAt?: string;
}

function parseRange(range: string, max: number): [number, number] {
  if (range.startsWith("<")) return [0, Number(range.slice(1))];
  if (range.endsWith("+")) return [Number(range.slice(0, -1)), max];
  const [a, b] = range.split("-").map(Number);
  return [a, b];
}

function safe(n: number | null | undefined, digits = 3): string {
  return Number.isFinite(n) ? `$${(n as number).toFixed(digits)}` : "—";
}

export default function MarketsPanelClient({
  entries,
  mtdMm,
  stripMax,
  totalCashPnl,
  totalNotional,
  fetchedAt,
}: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const totalVolume = entries.reduce((acc, e) => acc + (e.volume || 0), 0);
  const ownedEntries = entries.filter((e) => !!e.position);
  const aggRoiRatio =
    totalCashPnl != null && totalNotional && totalNotional > 0
      ? totalCashPnl / totalNotional
      : null;
  const hasPosition = ownedEntries.length > 0;

  return (
    <section className={styles.panel} aria-label="Polymarket markets">
      <section className={styles.dist} aria-label="Distribución implícita del mercado">
        <div
          className={`${styles.distCols} ${hasPosition ? "" : styles.distCols4}`}
          aria-hidden="true"
        >
          <span className={styles.colHead}>Rango (mm)</span>
          <span className={styles.colHeadBar}>Implícita</span>
          <span className={styles.colHeadRight}>Yes</span>
          {hasPosition && <span className={styles.colHeadRight}>Tu PnL</span>}
          <span />
        </div>

        <ul className={styles.distList} role="list">
          {entries.map((e) => {
            const isOwned = !!e.position;
            const isOpen = openSlug === e.slug;
            const yesPct = Math.max(0, Math.min(1, e.yesPrice));
            const [lower, upper] = parseRange(e.range, stripMax);
            const containsMtd = mtdMm < upper && mtdMm >= lower;

            return (
              <li
                key={e.slug}
                className={`${styles.distRow} ${isOwned ? styles.distRowOwned : ""} ${
                  containsMtd ? styles.distRowCurrent : ""
                } ${isOpen ? styles.distRowOpen : ""}`}
              >
                <button
                  type="button"
                  className={`${styles.rowHead} ${
                    hasPosition ? "" : styles.rowHead4
                  }`}
                  onClick={() => setOpenSlug(isOpen ? null : e.slug)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.range}>
                    {containsMtd && (
                      <span className={styles.mtdMark} aria-label="contiene MTD actual">
                        ●
                      </span>
                    )}
                    {e.range}
                    {isOwned && (
                      <span className={styles.sideTag}>{e.position!.side}</span>
                    )}
                  </span>

                  <span
                    className={styles.bar}
                    aria-label={`${(yesPct * 100).toFixed(0)} percent implied probability`}
                  >
                    <span
                      className={`${styles.barFill} ${
                        isOwned ? styles.barFillOwned : ""
                      }`}
                      style={{ transform: `scaleX(${yesPct})` }}
                    />
                    <span className={styles.barInline}>
                      {(yesPct * 100).toFixed(yesPct < 0.1 ? 1 : 0)}%
                    </span>
                  </span>

                  <span className={styles.priceCol}>
                    ${e.yesPrice.toFixed(e.yesPrice < 0.1 ? 3 : 2)}
                  </span>

                  {hasPosition && (
                    <span className={styles.pnlCol}>
                      {isOwned ? (
                        <span
                          className={
                            e.position!.cashPnl >= 0 ? styles.tickPos : styles.tickNeg
                          }
                        >
                          {fmtUsd(e.position!.cashPnl)}
                        </span>
                      ) : (
                        <span className={styles.pnlEmpty} aria-hidden="true">
                          ·
                        </span>
                      )}
                    </span>
                  )}

                  <svg
                    className={`${styles.chev} ${isOpen ? styles.chevOpen : ""}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 4l4 4-4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isOpen && (
                  <div className={styles.detail}>
                    <div className={styles.detailGrid}>
                      <div>
                        <p className={styles.detailLabel}>
                          {isOwned ? "Posición" : "Mercado"}
                        </p>
                        <dl className={styles.statTable}>
                          {isOwned ? (
                            <>
                              <dt className={styles.statKey}>Side</dt>
                              <dd className={styles.statValue}>
                                {e.position!.side.toUpperCase()}
                              </dd>
                              <dt className={styles.statKey}>Avg buy</dt>
                              <dd className={styles.statValue}>
                                {safe(e.position!.avgPrice)}
                              </dd>
                              <dt className={styles.statKey}>Mark</dt>
                              <dd className={styles.statValue}>
                                {safe(e.position!.curPrice)}
                              </dd>
                              <dt className={styles.statKey}>Size</dt>
                              <dd className={styles.statValue}>
                                {Number.isFinite(e.position!.size)
                                  ? `${e.position!.size.toLocaleString("en-US", {
                                      maximumFractionDigits: 1,
                                    })} ct`
                                  : "—"}
                              </dd>
                              <dt className={styles.statKey}>PnL</dt>
                              <dd
                                className={`${styles.statValue} ${
                                  e.position!.cashPnl >= 0
                                    ? styles.tickPos
                                    : styles.tickNeg
                                }`}
                              >
                                {fmtUsd(e.position!.cashPnl)} (
                                {fmtPctRaw(e.position!.pnlPct)})
                              </dd>
                            </>
                          ) : (
                            <>
                              <dt className={styles.statKey}>Yes</dt>
                              <dd className={styles.statValue}>
                                ${e.yesPrice.toFixed(3)}
                              </dd>
                              <dt className={styles.statKey}>No</dt>
                              <dd className={styles.statValue}>
                                ${e.noPrice.toFixed(3)}
                              </dd>
                              <dt className={styles.statKey}>Volume</dt>
                              <dd className={styles.statValue}>
                                {fmtVolume(e.volume)}
                              </dd>
                              <dt className={styles.statKey}>Range</dt>
                              <dd className={styles.statValue}>
                                {lower}–{upper === stripMax ? `${stripMax}+` : upper} mm
                              </dd>
                            </>
                          )}
                        </dl>
                      </div>

                      <div>
                        <p className={styles.detailLabel}>Orderbook · top 5</p>
                        <OrderbookPanel
                          yesTokenId={e.yesTokenId}
                          noTokenId={e.noTokenId}
                          slug={e.slug}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {hasPosition && (
        <section className={styles.posStrip} aria-label="Tu posición">
          <header className={styles.posHead}>
            <span className={styles.sectionLabel}>Tu posición</span>
            {totalCashPnl != null && (
              <span
                className={`${styles.posTotal} ${
                  totalCashPnl >= 0 ? styles.tickPos : styles.tickNeg
                }`}
              >
                {fmtUsd(totalCashPnl)}
                {aggRoiRatio != null && (
                  <span className={styles.posTotalPct}>
                    {" · "}
                    {fmtPctRatio(aggRoiRatio)}
                  </span>
                )}
              </span>
            )}
          </header>
          <ul className={styles.posLegs} role="list">
            {ownedEntries.map((e) => {
              const p = e.position!;
              const isOpen = openSlug === e.slug;
              const positive = p.cashPnl >= 0;
              return (
                <li key={e.slug} className={styles.posLeg}>
                  <button
                    type="button"
                    className={styles.posLegBtn}
                    onClick={() => setOpenSlug(isOpen ? null : e.slug)}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.posLegTop}>
                      <span className={styles.posLegRange}>
                        {e.range}
                        <span className={styles.sideTag}>{p.side}</span>
                      </span>
                      <span
                        className={`${styles.posLegPnl} ${
                          positive ? styles.tickPos : styles.tickNeg
                        }`}
                      >
                        {fmtUsd(p.cashPnl)}
                      </span>
                    </div>
                    <div className={styles.posLegBot}>
                      <span className={styles.posLegPrice}>
                        {safe(p.avgPrice)}
                        <span className={styles.posLegArrow}>→</span>
                        {safe(p.curPrice)}
                      </span>
                      <span
                        className={`${styles.posLegRoi} ${
                          positive ? styles.tickPos : styles.tickNeg
                        }`}
                      >
                        {fmtPctRaw(p.pnlPct)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className={styles.foot}>
        <span>
          Vol total <span className={styles.footValue}>{fmtVolume(totalVolume)}</span>
        </span>
        <span className={styles.footMuted}>
          9 sub-markets · res. 30 abr{fetchedAt && ` · precios ${fetchedAt}`}
        </span>
      </footer>
    </section>
  );
}
