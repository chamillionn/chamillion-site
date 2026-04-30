"use client";

import { useEffect, useState } from "react";
import type { Orderbook } from "@/lib/polymarket-api";
import styles from "./markets-panel.module.css";

interface Props {
  yesTokenId: string | null;
  noTokenId: string | null;
  slug: string;
}

const TOP_LEVELS = 5;

async function fetchBook(token: string, signal: AbortSignal): Promise<Orderbook | null> {
  const res = await fetch(`/api/polymarket/orderbook?token=${encodeURIComponent(token)}`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { orderbook?: Orderbook };
  return json.orderbook ?? null;
}

export default function OrderbookPanel({ yesTokenId, noTokenId, slug }: Props) {
  const [yes, setYes] = useState<Orderbook | null>(null);
  const [no, setNo] = useState<Orderbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yesTokenId && !noTokenId) {
      setLoading(false);
      setError("Mercado sin libro disponible.");
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      yesTokenId ? fetchBook(yesTokenId, ctrl.signal) : Promise.resolve(null),
      noTokenId ? fetchBook(noTokenId, ctrl.signal) : Promise.resolve(null),
    ])
      .then(([y, n]) => {
        setYes(y);
        setNo(n);
        setLoading(false);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        console.error("[orderbook]", e);
        setError("No se pudo cargar el libro.");
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [yesTokenId, noTokenId, slug]);

  if (loading) {
    return <div className={styles.bookLoading}>Cargando libro…</div>;
  }
  if (error) {
    return <div className={styles.bookEmpty}>{error}</div>;
  }

  return (
    <div className={styles.book}>
      <BookSide label="YES" book={yes} />
      <BookSide label="NO" book={no} />
    </div>
  );
}

function BookSide({ label, book }: { label: "YES" | "NO"; book: Orderbook | null }) {
  // Bloomberg convention: asks descending top-down (worst ask top, best ask
  // just above the spread). Bids descending top-down (best bid below spread,
  // worst bid bottom). Best ask + best bid touch in the middle.
  const asksReversed = book?.asks?.slice(0, TOP_LEVELS).reverse() ?? [];
  const bids = book?.bids?.slice(0, TOP_LEVELS) ?? [];
  const isEmpty = asksReversed.length === 0 && bids.length === 0;

  return (
    <div className={styles.bookSide}>
      <div className={styles.bookHeader}>
        <span>{label} · price</span>
        <span>size</span>
      </div>
      {isEmpty ? (
        <div className={styles.bookEmpty}>empty</div>
      ) : (
        <>
          {asksReversed.map((l, i) => (
            <div key={`a-${i}-${l.price}`} className={styles.bookLevel}>
              <span className={styles.bookPriceAsk}>${l.price.toFixed(3)}</span>
              <span className={styles.bookSize}>
                {l.size.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
          {bids.map((l, i) => (
            <div key={`b-${i}-${l.price}`} className={styles.bookLevel}>
              <span className={styles.bookPriceBid}>${l.price.toFixed(3)}</span>
              <span className={styles.bookSize}>
                {l.size.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
