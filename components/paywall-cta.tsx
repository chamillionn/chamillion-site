"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./paywall-cta.module.css";

interface Props {
  isLoggedIn: boolean;
}

export default function PaywallCTA({ isLoggedIn }: Props) {
  const pathname = usePathname();

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
              <button disabled className={styles.primaryBtnDisabled}>
                Proximamente
              </button>
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
              <span className={styles.secondaryBtn}>
                Suscripcion proximamente
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
