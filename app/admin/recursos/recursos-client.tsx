"use client";

import styles from "./recursos.module.css";

interface ServiceInfo {
  name: string;
  plan: string;
  icon: string;
  dashboardUrl: string;
  limits: { label: string; value: string; used?: string; pct?: number }[];
  notes?: string;
}

const SERVICES: ServiceInfo[] = [
  {
    name: "Vercel",
    plan: "Hobby (Gratis)",
    icon: "M12 2L2 19.5h20L12 2z",
    dashboardUrl: "https://vercel.com/dashboard",
    limits: [
      { label: "Bandwidth", value: "100 GB/mes" },
      { label: "Serverless Exec", value: "100 GB-h/mes" },
      { label: "Builds", value: "6.000/mes" },
      { label: "Serverless Timeout", value: "10s (60s Pro)" },
    ],
    notes: "No expone API de uso en el tier gratuito. Verificar en el dashboard.",
  },
  {
    name: "Supabase",
    plan: "Free Tier",
    icon: "M12 3L4 9v6l8 6 8-6V9l-8-6z",
    dashboardUrl: "https://supabase.com/dashboard/project/mdkejqbsfkhfhohhsljy",
    limits: [
      { label: "Base de datos", value: "500 MB" },
      { label: "Bandwidth", value: "5 GB/mes" },
      { label: "Storage", value: "1 GB" },
      { label: "Realtime", value: "200 conexiones" },
      { label: "Edge Functions", value: "500K invocaciones/mes" },
      { label: "Auth", value: "50K MAU" },
    ],
  },
  {
    name: "Modal",
    plan: "Free Tier",
    icon: "M4 6h16M4 12h16M4 18h16",
    dashboardUrl: "https://modal.com/apps/chamillionn/main/deployed/kronos-predictor",
    limits: [
      { label: "GPU Compute", value: "$30/mes en créditos" },
      { label: "GPU", value: "T4 (Kronos)" },
      { label: "Scaledown", value: "300s inactividad" },
      { label: "Cold start", value: "~25-30s" },
    ],
    notes: "Cada predicción de Kronos consume GPU. Cold starts incluidos en coste.",
  },
  {
    name: "Resend",
    plan: "Free Tier",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    dashboardUrl: "https://resend.com/overview",
    limits: [
      { label: "Emails", value: "100/día" },
      { label: "Emails/mes", value: "3.000" },
      { label: "Dominio", value: "chamillion.site" },
    ],
    notes: "Usado para magic links (Supabase SMTP) y digest diario (cuando se active).",
  },
  {
    name: "Stripe",
    plan: "Pay as you go",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6",
    dashboardUrl: "https://dashboard.stripe.com",
    limits: [
      { label: "Comisión", value: "1.5% + 0.25€/txn" },
      { label: "Modo", value: "Test" },
    ],
    notes: "Sin límite de uso. Coste proporcional a transacciones.",
  },
];

interface Props {
  dbCounts: Record<string, number>;
  totalRows: number;
}

export default function RecursosClient({ dbCounts, totalRows }: Props) {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Recursos</h1>
      <p className={styles.subtitle}>
        Monitorización de servicios y consumo del tier gratuito.
      </p>

      {/* ── Supabase DB overview ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Base de datos</h2>
        <div className={styles.dbGrid}>
          {Object.entries(dbCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([table, count]) => (
              <div key={table} className={styles.dbRow}>
                <span className={styles.dbTable}>{table}</span>
                <span className={styles.dbCount}>
                  {count.toLocaleString("es-ES")}
                </span>
              </div>
            ))}
          <div className={`${styles.dbRow} ${styles.dbTotal}`}>
            <span className={styles.dbTable}>Total</span>
            <span className={styles.dbCount}>
              {totalRows.toLocaleString("es-ES")}
            </span>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Servicios</h2>
        <div className={styles.serviceGrid}>
          {SERVICES.map((svc) => (
            <div key={svc.name} className={styles.service}>
              <div className={styles.serviceHeader}>
                <svg
                  className={styles.serviceIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={svc.icon} />
                </svg>
                <div className={styles.serviceInfo}>
                  <span className={styles.serviceName}>{svc.name}</span>
                  <span className={styles.servicePlan}>{svc.plan}</span>
                </div>
                <a
                  href={svc.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.serviceLink}
                >
                  Dashboard
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>

              <div className={styles.limitsGrid}>
                {svc.limits.map((limit) => (
                  <div key={limit.label} className={styles.limit}>
                    <span className={styles.limitLabel}>{limit.label}</span>
                    <span className={styles.limitValue}>{limit.value}</span>
                  </div>
                ))}
              </div>

              {svc.notes && (
                <p className={styles.serviceNotes}>{svc.notes}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
