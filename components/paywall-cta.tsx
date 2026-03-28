"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./paywall-cta.module.css";

interface Price {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  interval: string | null;
}

interface Props {
  isLoggedIn: boolean;
}

const INTERVAL_LABELS: Record<string, string> = {
  month: "mes",
  year: "año",
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function priceLabel(p: Price): string {
  return `${formatPrice(p.unitAmount, p.currency)}/${INTERVAL_LABELS[p.interval ?? ""] ?? p.interval}`;
}

export default function PaywallCTA({ isLoggedIn }: Props) {
  const pathname = usePathname();
  const [prices, setPrices] = useState<Price[]>([]);
  const [priceError, setPriceError] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  function fetchPrices() {
    setPriceError(false);
    fetch("/api/stripe/prices")
      .then((r) => r.json())
      .then((data) => setPrices(data))
      .catch(() => setPriceError(true));
  }

  // Always fetch prices — show to everyone, not just logged-in users
  useEffect(() => {
    fetchPrices();
  }, []);

  async function handleCheckout(priceId: string) {
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, returnTo: pathname }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className={styles.fadeOverlay}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3 className={styles.heading}>Contenido premium</h3>

        <p className={styles.text}>
          Accede al articulo completo, el portfolio verificable en tiempo real
          y todos los analisis de Chamillion.
        </p>

        <div className={styles.actions}>
          {isLoggedIn ? (
            <>
              {priceError ? (
                <button className={styles.secondaryBtn} onClick={fetchPrices}>
                  Error al cargar planes. Reintentar
                </button>
              ) : prices.length > 0 ? (
                prices.map((p) => (
                  <button
                    key={p.id}
                    className={styles.primaryBtn}
                    onClick={() => handleCheckout(p.id)}
                    disabled={loading !== null}
                    style={loading === p.id ? { opacity: 0.6 } : undefined}
                  >
                    {loading === p.id
                      ? "Redirigiendo a checkout..."
                      : `Suscribirme · ${priceLabel(p)}`}
                  </button>
                ))
              ) : (
                <span className={styles.secondaryBtn}>Cargando...</span>
              )}
            </>
          ) : (
            <Link
              href="/suscribirse"
              className={styles.primaryBtn}
            >
              {prices.length > 0
                ? `Suscribirme · ${priceLabel(prices[0])}`
                : "Suscribirme"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
