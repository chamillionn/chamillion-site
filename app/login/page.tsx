"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePendingLogin } from "@/hooks/use-pending-login";
import styles from "./page.module.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/";
  // Only allow relative paths to prevent open redirect
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const isAdmin = next.startsWith("/admin");
  const isFromArticle = next.startsWith("/newsletter/") && next !== "/newsletter";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = next;
      } else {
        setCheckingSession(false);
      }
    });
  }, [next]);

  // Magic link state
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState("");

  // Poll for cross-device magic link verification
  usePendingLogin(email, magicSent, () => {
    window.location.href = next;
  });

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    setMagicLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    });

    setMagicLoading(false);

    if (authError) {
      setMagicError(authError.message);
      return;
    }

    setMagicSent(true);
  }

  if (checkingSession) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Verificando sesion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>
          &larr; Inicio
        </Link>

        <h1 className={styles.title}>
          {isAdmin ? "Admin" : isFromArticle ? "Accede al contenido" : "Iniciar sesion"}
        </h1>
        <p className={styles.subtitle}>
          {isAdmin
            ? "Acceso restringido."
            : isFromArticle
              ? "Introduce tu email para continuar leyendo el articulo completo."
              : "Introduce tu email para acceder."}
        </p>

        {/* ── Magic link (primary) ── */}
        {magicSent ? (
          <div className={styles.success}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            <span>
              Enlace enviado a <strong>{email}</strong>. Revisa tu bandeja de
              entrada.
            </span>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className={styles.form}>
            <div>
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={magicLoading}
                className={styles.input}
                autoComplete="email"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={magicLoading || !email}
              className={styles.button}
            >
              {magicLoading ? "Enviando..." : "Continuar"}
            </button>
            {magicError && <p className={styles.error} role="alert">{magicError}</p>}
            {authError === "auth_failed" && <p className={styles.error} role="alert">El enlace ha expirado o no es valido. Intentalo de nuevo.</p>}
          </form>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
