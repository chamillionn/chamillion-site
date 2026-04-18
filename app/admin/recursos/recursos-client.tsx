"use client";

import { useState, useEffect, useTransition } from "react";
import { toggleKronosEnabled } from "./actions";
import styles from "./recursos.module.css";

interface ServiceInfo {
  name: string;
  plan: string;
  icon: string;
  dashboardUrl: string;
  limits: { label: string; value: string }[];
  notes?: string;
  liveUsage?: boolean;
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
    name: "Twelve Data",
    plan: "Basic (Free)",
    icon: "M3 12h18M3 6h18M3 18h18",
    dashboardUrl: "https://twelvedata.com/account/usage",
    limits: [
      { label: "Requests/día", value: "800" },
      { label: "Requests/minuto", value: "8" },
      { label: "Activos", value: "Acciones, índices, forex, commodities" },
    ],
    liveUsage: true,
    notes: "Usado para activos no-crypto en Kronos. El tier free es compartido entre todos los usuarios.",
  },
  {
    name: "Modal",
    plan: "Free Tier",
    icon: "M4 6h16M4 12h16M4 18h16",
    dashboardUrl: "https://modal.com/apps/chamillionn/main/deployed/kronos-predictor",
    limits: [
      { label: "Créditos", value: "$30/mes" },
      { label: "GPU", value: "T4 (Kronos)" },
      { label: "Scaledown", value: "300s" },
      { label: "Cold start", value: "~25-30s" },
    ],
    liveUsage: true,
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
  kronosEnabled: boolean;
}

interface ModalUsage {
  totalCost: string;
  creditLimit: number;
  usedPct: string;
  items: { Description: string; Cost: string; "Interval Start": string }[];
}

interface TwelveUsage {
  available: boolean;
  usage?: {
    currentUsage: number;
    planLimit: number;
    dailyUsage: number;
    planDailyLimit: number;
    planCategory: string;
  };
  block: { blocked: boolean; untilTs: number };
}

export default function RecursosClient({ dbCounts, totalRows, kronosEnabled }: Props) {
  const [modal, setModal] = useState<ModalUsage | null>(null);
  const [modalLoading, setModalLoading] = useState(true);
  const [twelve, setTwelve] = useState<TwelveUsage | null>(null);
  const [twelveLoading, setTwelveLoading] = useState(true);
  const [kronosOn, setKronosOn] = useState(kronosEnabled);
  const [pending, startTransition] = useTransition();

  function handleToggleKronos() {
    const next = !kronosOn;
    setKronosOn(next);
    startTransition(async () => {
      const res = await toggleKronosEnabled(next);
      if (res.error) setKronosOn(!next);
    });
  }

  useEffect(() => {
    fetch("/api/admin/modal-usage")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setModal(data);
      })
      .catch(() => {})
      .finally(() => setModalLoading(false));

    fetch("/api/admin/twelvedata-usage")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTwelve(data);
      })
      .catch(() => {})
      .finally(() => setTwelveLoading(false));
  }, []);

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

              {svc.liveUsage && svc.name === "Twelve Data" && (
                <div className={styles.usageBlock}>
                  {twelveLoading ? (
                    <span className={styles.usageLoading}>Cargando uso...</span>
                  ) : twelve?.available && twelve.usage ? (
                    <>
                      <div className={styles.usageHeader}>
                        <span className={styles.usageLabel}>Hoy</span>
                        <span className={styles.usageValue}>
                          {twelve.usage.dailyUsage} / {twelve.usage.planDailyLimit}
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min((twelve.usage.dailyUsage / twelve.usage.planDailyLimit) * 100, 100)}%` }}
                        />
                      </div>
                      <div className={styles.usageHeader} style={{ marginTop: 8 }}>
                        <span className={styles.usageLabel}>Este minuto</span>
                        <span className={styles.usageValue}>
                          {twelve.usage.currentUsage} / {twelve.usage.planLimit}
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min((twelve.usage.currentUsage / twelve.usage.planLimit) * 100, 100)}%` }}
                        />
                      </div>
                      {twelve.block.blocked && (
                        <p className={styles.serviceNotes} style={{ color: "#c7555a" }}>
                          ⚠ Bloqueado hasta{" "}
                          {new Date(twelve.block.untilTs).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          — activos non-crypto temporalmente desactivados en /kronos.
                        </p>
                      )}
                    </>
                  ) : (
                    <span className={styles.usageLoading}>
                      No se pudo obtener el uso (TWELVEDATA_API_KEY no configurada o API caída)
                    </span>
                  )}
                </div>
              )}

              {svc.liveUsage && svc.name === "Modal" && (
                <>
                  <div className={styles.usageBlock}>
                    {modalLoading ? (
                      <span className={styles.usageLoading}>Cargando uso...</span>
                    ) : modal ? (
                      <>
                        <div className={styles.usageHeader}>
                          <span className={styles.usageLabel}>Uso este mes</span>
                          <span className={styles.usageValue}>
                            ${modal.totalCost} / ${modal.creditLimit}
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min(parseFloat(modal.usedPct), 100)}%` }}
                          />
                        </div>
                        <span className={styles.usagePct}>{modal.usedPct}%</span>
                      </>
                    ) : (
                      <span className={styles.usageLoading}>No se pudo obtener el uso</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.killSwitch}
                    onClick={handleToggleKronos}
                    disabled={pending}
                    aria-pressed={kronosOn}
                  >
                    <span className={styles.killSwitchLabel}>
                      Kronos público
                      <span className={styles.killSwitchHint}>
                        {kronosOn
                          ? "Demo accesible en /kronos"
                          : "Apagado — banner offline"}
                      </span>
                    </span>
                    <span
                      className={`${styles.killSwitchToggle} ${kronosOn ? styles.killSwitchOn : ""}`}
                      aria-hidden="true"
                    >
                      <span className={styles.killSwitchKnob} />
                    </span>
                  </button>
                </>
              )}

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
