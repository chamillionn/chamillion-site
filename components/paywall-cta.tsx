"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./paywall-cta.module.css";

interface Price {
  id: string;
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

export default function PaywallCTA({ isLoggedIn }: Props) {
  const pathname = usePathname();
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/stripe/prices")
      .then((r) => r.json())
      .then((data) => setPrices(data))
      .catch(() => {});
  }, [isLoggedIn]);

  async function handleCheckout(priceId: string) {
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
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

        {isLoggedIn ? (
          <>
            <p className={styles.text}>
              Suscribete para acceder al articulo completo y todo el contenido
              premium de Chamillion.
            </p>
            <div className={styles.actions}>
              {prices.length > 0 ? (
                prices.map((p) => (
                  <button
                    key={p.id}
                    className={styles.primaryBtn}
                    onClick={() => handleCheckout(p.id)}
                    disabled={loading !== null}
                    style={loading === p.id ? { opacity: 0.6 } : undefined}
                  >
                    {loading === p.id
                      ? "Redirigiendo..."
                      : `${formatPrice(p.unitAmount, p.currency)}/${INTERVAL_LABELS[p.interval ?? ""] ?? p.interval}`}
                  </button>
                ))
              ) : (
                <span className={styles.secondaryBtn}>Cargando planes...</span>
              )}
            </div>
          </>
        ) : (
          <>
            <p className={styles.text}>
              Inicia sesion o suscribete para leer el articulo completo.
            </p>
            <div className={styles.actions}>
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className={styles.primaryBtn}
              >
                Acceder
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className={styles.secondaryBtn}
              >
                Ver planes
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
