"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateDisplayName } from "./actions";
import styles from "./page.module.css";

interface Props {
  email: string;
  displayName: string | null;
  role: "free" | "member" | "admin";
}

const ROLE_LABELS: Record<string, string> = {
  free: "Free",
  member: "Miembro",
  admin: "Admin",
};

export default function CuentaClient({ email, displayName, role }: Props) {
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

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
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const badgeClass =
    role === "admin"
      ? styles.badgeAdmin
      : role === "member"
        ? styles.badgeMember
        : styles.badgeFree;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>
          &larr; Inicio
        </Link>

        <h1 className={styles.title}>Mi cuenta</h1>

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

        {/* Display name */}
        <div className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre (opcional)"
            maxLength={50}
            className={styles.input}
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
          <p
            className={
              feedback.type === "success" ? styles.success : styles.error
            }
          >
            {feedback.msg}
          </p>
        )}

        <div className={styles.divider} />

        {/* CTA for free users */}
        {role === "free" && (
          <div className={styles.cta}>
            <p className={styles.ctaText}>
              Suscribete para acceder al Hub y al contenido premium de la
              newsletter.
            </p>
            <button disabled className={styles.ctaButton}>
              Proximamente
            </button>
          </div>
        )}

        {/* Admin link */}
        {role === "admin" && (
          <Link href="/admin" className={styles.adminLink}>
            Panel de administracion &rarr;
          </Link>
        )}

        {/* Logout */}
        <button onClick={handleLogout} className={styles.buttonDanger}>
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
