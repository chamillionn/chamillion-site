"use client";

import type { ConsultationType, Consultation } from "@/lib/supabase/types";
import styles from "./consultorias.module.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    canceled: "Cancelada",
  };
  return map[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "confirmed") return styles.statusConfirmed;
  if (status === "completed") return styles.statusCompleted;
  if (status === "canceled") return styles.statusCanceled;
  return styles.statusPending;
}

interface Props {
  types: ConsultationType[];
  bookings: Consultation[];
}

export default function ConsultoriasClient({ types, bookings }: Props) {
  return (
    <div className={`page-transition ${styles.page}`}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <h1 className={styles.title}>Consultorías</h1>
        <p className={styles.subtitle}>
          Sesiones 1:1 para resolver dudas sobre tu cartera o estrategia de inversión.
        </p>
      </header>

      {/* ── Session types ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Sesiones disponibles</h2>

        {types.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No hay sesiones disponibles todavía.</p>
            <p className={styles.emptyHint}>Se publicarán próximamente.</p>
          </div>
        ) : (
          <div className={styles.typesList}>
            {types.map((t) => (
              <article key={t.id} className={styles.typeItem}>
                <div className={styles.typeHeader}>
                  <span className={styles.typeName}>{t.name}</span>
                  <span className={styles.typeMeta}>
                    {t.duration} min
                  </span>
                </div>
                {t.description && (
                  <p className={styles.typeDesc}>{t.description}</p>
                )}
                <div className={styles.typeFooter}>
                  <span className={styles.typePrice}>{t.price_eur}€</span>
                  <button
                    className={styles.bookBtn}
                    disabled
                    title="Próximamente"
                  >
                    Reservar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── User bookings ── */}
      {bookings.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Mis sesiones</h2>
          <div className={styles.bookingsList}>
            {bookings.map((b) => (
              <div key={b.id} className={styles.bookingItem}>
                <span className={styles.bookingDate}>
                  {formatDate(b.scheduled_at)}
                </span>
                <span className={styles.bookingDuration}>
                  {b.duration} min
                </span>
                <span className={`${styles.bookingStatus} ${statusClass(b.status)}`}>
                  {statusLabel(b.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
