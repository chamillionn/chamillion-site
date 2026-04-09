"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateDisplayName, deleteOwnAccount } from "./actions";
import Spinner from "@/components/spinner";
import ErrorBox from "@/components/error-box";
import styles from "./page.module.css";

interface Price {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  interval: string | null;
}

interface Props {
  email: string;
  displayName: string | null;
  role: "free" | "member" | "admin";
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  free: "Free",
  member: "Miembro",
  admin: "Admin",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  trialing: "Prueba",
  none: "Sin suscripcion",
};

const INTERVAL_LABELS: Record<string, string> = {
  month: "mes",
  year: "año",
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export default function CuentaClient({
  email,
  displayName,
  role,
  subscriptionStatus,
  stripeCustomerId,
}: Props) {
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [priceError, setPriceError] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [checkoutMsg, setCheckoutMsg] = useState<{
    type: "success" | "muted";
    text: string;
  } | null>(null);

  // Read checkout result from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setCheckoutMsg({ type: "success", text: "Suscripcion activada. Bienvenido." });
    } else if (checkout === "cancel") {
      setCheckoutMsg({ type: "muted", text: "Proceso de pago cancelado." });
    }
    if (checkout) {
      window.history.replaceState({}, "", window.location.pathname);
      const timer = setTimeout(() => setCheckoutMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  function fetchPrices() {
    setPriceError(false);
    fetch("/api/stripe/prices")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPrices(data);
      })
      .catch(() => setPriceError(true));
  }

  useEffect(() => {
    if (role !== "free") return;
    fetchPrices();
  }, [role]);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    const fd = new FormData();
    fd.set("display_name", name);
    const result = await updateDisplayName(fd);

    setSaving(false);

    if (result.error) {
      setFeedback({ type: "error", msg: result.error });
    } else {
      setFeedback({ type: "success", msg: "Guardado" });
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }

  async function handleCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    setFeedback(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: "error", msg: "Error al iniciar el pago. Intentalo de nuevo." });
        setCheckoutLoading(null);
      }
    } catch {
      setFeedback({ type: "error", msg: "Error al iniciar el pago. Intentalo de nuevo." });
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: "error", msg: "Error al abrir el portal. Intentalo de nuevo." });
        setPortalLoading(false);
      }
    } catch {
      setFeedback({ type: "error", msg: "Error al abrir el portal. Intentalo de nuevo." });
      setPortalLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteOwnAccount(deleteEmail);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
    } else {
      // Account deleted — sign out locally and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/?deleted=1";
    }
  }

  const badgeClass =
    role === "admin"
      ? styles.badgeAdmin
      : role === "member"
        ? styles.badgeMember
        : styles.badgeFree;

  const hasStripeSubscription =
    !!stripeCustomerId &&
    subscriptionStatus !== "none" &&
    subscriptionStatus !== null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>
          &larr; Inicio
        </Link>

        <h1 className={styles.title}>Mi cuenta</h1>

        {checkoutMsg && (
          <p
            role="status"
            style={{
              fontSize: 13,
              color: checkoutMsg.type === "success" ? "var(--green)" : "var(--text-muted)",
              fontFamily: "var(--font-dm-mono), monospace",
            }}
          >
            {checkoutMsg.text}
          </p>
        )}

        {/* Email */}
        <div className={styles.field}>
          <span className={styles.label}>Email</span>
          <span className={styles.value}>{email}</span>
        </div>

        {/* Role */}
        <div className={styles.field}>
          <span className={styles.label}>Plan</span>
          <span className={`${styles.badge} ${badgeClass}`}>
            {ROLE_LABELS[role]}
          </span>
        </div>

        {/* Subscription status for members/admins */}
        {role !== "free" && (
          <div className={styles.field}>
            <span className={styles.label}>Suscripcion</span>
            <span className={styles.value}>
              {hasStripeSubscription
                ? (STATUS_LABELS[subscriptionStatus ?? ""] ?? subscriptionStatus)
                : "Acceso otorgado"}
            </span>
          </div>
        )}

        {/* Display name */}
        <div className={styles.field}>
          <label htmlFor="cuenta-name" className={styles.label}>Nombre</label>
          <input
            id="cuenta-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre (opcional)"
            maxLength={50}
            className={styles.input}
            autoComplete="name"
            aria-describedby={feedback?.type === "error" ? "cuenta-feedback" : undefined}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || name === (displayName ?? "")}
          className={styles.button}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {feedback && (
          feedback.type === "error"
            ? <ErrorBox>{feedback.msg}</ErrorBox>
            : <p id="cuenta-feedback" role="status" className={styles.success}>{feedback.msg}</p>
        )}

        <div className={styles.divider} />

        {/* CTA for free users — pricing cards */}
        {role === "free" && (
          <div className={styles.cta}>
            <p className={styles.ctaText}>
              Acceso al Hub, analisis premium y contenido exclusivo.
            </p>
            {priceError ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "var(--red)" }}>
                  No se pudieron cargar los planes.
                </span>
                <button className={styles.button} onClick={fetchPrices} style={{ fontSize: 12, padding: "6px 14px" }}>
                  Reintentar
                </button>
              </div>
            ) : prices.length > 0 ? (
              <div className={styles.tierList}>
                {[...prices]
                  .sort((a, b) => a.unitAmount - b.unitAmount)
                  .map((p) => {
                    const isOpen = expandedTier === p.id;
                    const isLoading = checkoutLoading === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`${styles.tierCard} ${isOpen ? styles.tierCardOpen : ""}`}
                      >
                        <button
                          className={styles.tierToggle}
                          onClick={() => setExpandedTier(isOpen ? null : p.id)}
                          aria-expanded={isOpen}
                        >
                          <span className={styles.tierName}>{p.name}</span>
                          <span className={styles.tierMeta}>
                            {formatPrice(p.unitAmount, p.currency)}
                            <span className={styles.tierMetaInterval}>
                              /{INTERVAL_LABELS[p.interval ?? ""] ?? p.interval}
                            </span>
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.tierChevron}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <div className={`${styles.tierBody} ${isOpen ? styles.tierBodyOpen : ""}`}>
                          <div className={styles.tierBodyInner}>
                            <div className={styles.tierContent}>
                              <button
                                className={styles.tierCta}
                                onClick={() => handleCheckout(p.id)}
                                disabled={checkoutLoading !== null}
                              >
                                {isLoading ? <Spinner /> : "Elegir"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 48,
                      borderRadius: "var(--radius-md)",
                      background: "rgba(var(--steel-blue-rgb), 0.06)",
                      border: "1px solid var(--border)",
                      animation: "shimmer 1.5s ease-in-out infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Portal button for members with Stripe subscription */}
        {role !== "free" && hasStripeSubscription && (
          <button
            className={styles.buttonSecondary}
            onClick={handlePortal}
            disabled={portalLoading}
          >
            {portalLoading ? <><Spinner /> Redirigiendo...</> : "Gestionar suscripcion"}
          </button>
        )}

        {/* Admin link */}
        {role === "admin" && (
          <Link href="/admin" className={styles.adminLink}>
            Panel de administracion &rarr;
          </Link>
        )}

        {/* Danger zone */}
        {role !== "admin" && (
          <>
            <div className={styles.divider} />
            <div className={styles.dangerZone}>
              <span className={styles.dangerLabel}>Zona de peligro</span>
              {!showDeleteConfirm ? (
                <button
                  className={styles.buttonDanger}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Eliminar mi cuenta
                </button>
              ) : (
                <div className={styles.deleteConfirm}>
                  <p className={styles.deleteWarning}>
                    Esta accion es irreversible. Se eliminaran tu cuenta y todos tus datos.
                    Si tienes una suscripcion activa, sera cancelada.
                  </p>
                  <label htmlFor="delete-confirm-email" className={styles.label}>
                    Escribe tu email para confirmar
                  </label>
                  <input
                    id="delete-confirm-email"
                    type="email"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    placeholder={email}
                    className={styles.input}
                    autoComplete="off"
                  />
                  {deleteError && <ErrorBox>{deleteError}</ErrorBox>}
                  <div className={styles.deleteActions}>
                    <button
                      className={styles.buttonDeleteConfirm}
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteEmail !== email}
                    >
                      {deleting ? "Eliminando..." : "Confirmar eliminacion"}
                    </button>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteEmail("");
                        setDeleteError(null);
                      }}
                      disabled={deleting}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Logout */}
        <button onClick={handleLogout} className={styles.buttonDanger}>
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
