"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import SubscribeBg from "./subscribe-bg";
import styles from "./page.module.css";

interface Price {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  interval: string | null;
}

const INTERVAL_LABELS: Record<string, string> = {
  month: "mes",
  year: "ano",
};

const PLAN_DESC: Record<string, string> = {
  month: "Flexibilidad total, cancela cuando quieras.",
  year: "El mejor precio. Ahorra respecto al mensual.",
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const FEATURES = [
  "Glosario de conocimientos y herramientas",
  "Analisis exclusivos sobre oportunidades y mercados emergentes",
  "Cartera verificable en blockchain — cada posicion al detalle, con todo el historico",
];

function CheckIcon() {
  return (
    <svg className={styles.featureIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8.5L6 12L13.5 4.5" />
    </svg>
  );
}

function SuscribirseForm() {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan");

  const [prices, setPrices] = useState<Price[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [autoCheckoutDone, setAutoCheckoutDone] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/prices")
      .then((r) => r.json())
      .then((data) => setPrices(data))
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({ id: u.id, email: u.email ?? "" });
        supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single()
          .then(({ data }) => {
            setRole(data?.role ?? "free");
            setCheckingSession(false);
          });
      } else {
        setCheckingSession(false);
      }
    });
  }, []);

  const triggerCheckout = useCallback(async (priceId: string) => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, returnTo: "/suscribirse" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "Error al crear el checkout");
        setCheckoutLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Error de conexion");
      setCheckoutLoading(false);
    }
  }, []);

  useEffect(() => {
    if (planFromUrl && user && role === "free" && !autoCheckoutDone && !checkoutLoading) {
      setAutoCheckoutDone(true);
      triggerCheckout(planFromUrl);
    }
  }, [planFromUrl, user, role, autoCheckoutDone, checkoutLoading, triggerCheckout]);

  function handleSelectPlan(priceId: string) {
    if (user) {
      triggerCheckout(priceId);
    } else {
      setSelectedPlan(priceId);
      setEmailSent(false);
      setEmailError("");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/suscribirse?plan=${selectedPlan}`,
      },
    });

    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
      return;
    }
    setEmailSent(true);
  }

  const isMember = role === "member" || role === "admin";

  if (planFromUrl && user && role === "free" && !checkoutError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.redirecting}>Redirigiendo al pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SubscribeBg />
      <div className={`${styles.card} ${styles.animIn}`} style={{ animationDelay: "0s" }}>
        {/* Hero image */}
        <div className={styles.hero}>
          <Image
            className={styles.heroImg}
            src="/assets/newsletter/wanderer-post-01.png"
            alt="Chamillion"
            fill
            sizes="520px"
            priority
          />
          <div className={styles.heroGradient} />
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Label */}
          <div className={`${styles.label} ${styles.animIn}`} style={{ animationDelay: "0.1s" }}>
            Chamillion Premium
          </div>

          {/* Heading */}
          <h1 className={`${styles.title} ${styles.animIn}`} style={{ animationDelay: "0.15s" }}>
            Acceso completo a la vanguardia de los mercados
          </h1>

          {/* Subtitle */}
          <p className={`${styles.subtitle} ${styles.animIn}`} style={{ animationDelay: "0.2s" }}>
            Un todo en uno para seguir el proyecto desde dentro.
          </p>

          {/* Divider */}
          <div className={`${styles.divider} ${styles.animIn}`} style={{ animationDelay: "0.23s" }} />

          {/* Features */}
          <div className={`${styles.features} ${styles.animIn}`} style={{ animationDelay: "0.26s" }}>
            {FEATURES.map((f) => (
              <div key={f} className={styles.feature}>
                <CheckIcon />
                <span className={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={`${styles.divider} ${styles.animIn}`} style={{ animationDelay: "0.3s" }} />

          {/* Already member */}
          {isMember && (
            <div className={`${styles.already} ${styles.animIn}`} style={{ animationDelay: "0.33s" }}>
              Ya eres miembro.{" "}
              <Link href="/cuenta" className={styles.alreadyLink}>
                Ir a mi cuenta
              </Link>
            </div>
          )}

          {/* Plans + flow */}
          {!isMember && (
            <>
              {loadingPrices || checkingSession ? (
                <p className={styles.loading}>Cargando planes...</p>
              ) : prices.length === 0 ? (
                <p className={styles.error}>No se pudieron cargar los planes.</p>
              ) : (
                <>
                  {(() => {
                    const price = [...prices].sort((a, b) => a.unitAmount - b.unitAmount)[0];
                    const isSelected = selectedPlan === price.id;
                    const interval = price.interval ?? "";
                    return (
                      <div className={`${styles.planCta} ${styles.animIn}`} style={{ animationDelay: "0.33s" }}>
                        <div className={styles.planPriceWrap}>
                          <span className={styles.planPrice}>
                            {formatPrice(price.unitAmount, price.currency)}
                          </span>
                          <span className={styles.planInterval}>
                            {interval ? `/${INTERVAL_LABELS[interval] ?? interval}` : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.planBtn}
                          disabled={checkoutLoading}
                          onClick={() => handleSelectPlan(price.id)}
                        >
                          {checkoutLoading && isSelected ? "Cargando..." : "Suscribirme"}
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}

              {checkoutError && <p className={styles.error}>{checkoutError}</p>}

              {/* Email input */}
              {selectedPlan && !user && !emailSent && (
                <form onSubmit={handleEmailSubmit} className={styles.emailSection}>
                  <p className={styles.emailLabel}>
                    Introduce tu email para crear tu cuenta y continuar al pago.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    disabled={emailLoading}
                    className={styles.input}
                    autoComplete="email"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={emailLoading || !email}
                    className={styles.submitBtn}
                  >
                    {emailLoading ? "Enviando..." : "Continuar"}
                  </button>
                  {emailError && <p className={styles.error}>{emailError}</p>}
                </form>
              )}

              {/* Email sent */}
              {emailSent && (
                <div className={styles.success}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                  <span>
                    Enlace enviado a <strong>{email}</strong>. Revisa tu bandeja
                    de entrada — al abrirlo iras directamente al pago.
                  </span>
                </div>
              )}

            </>
          )}
        </div>
      </div>

      {/* Back to home */}
      <Link href="/" className={`${styles.homeBtn} ${styles.animIn}`} style={{ animationDelay: "0.42s" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Inicio
      </Link>
    </div>
  );
}

export default function SuscribirseClient() {
  return (
    <Suspense>
      <SuscribirseForm />
    </Suspense>
  );
}
