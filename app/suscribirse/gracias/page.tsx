import type { Metadata } from "next";
import Link from "next/link";
import styles from "./gracias.module.css";

export const metadata: Metadata = {
  title: "Bienvenido a Chamillion Premium",
  robots: { index: false },
};

export default function GraciasPage() {
  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.animIn}`}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        {/* Label */}
        <div className={styles.label}>Suscripción confirmada</div>

        {/* Heading */}
        <h1 className={styles.title}>Bienvenido a bordo</h1>

        {/* Body */}
        <p className={styles.body}>
          Ya tienes acceso completo a todo el contenido premium.
          Gracias por formar parte del proyecto.
        </p>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/newsletter" className={styles.primaryBtn}>
            Ir al Newsletter
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Ver la Cartera
          </Link>
        </div>
      </div>
    </div>
  );
}
