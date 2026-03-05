"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "./actions";
import styles from "./page.module.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/";
  // Only allow relative paths to prevent open redirect
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const isAdmin = next.startsWith("/admin");
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState(
    authError === "auth_failed"
      ? "El enlace de autenticacion ha expirado o no es valido. Intentalo de nuevo."
      : ""
  );

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

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(
        authError.message === "Invalid login credentials"
          ? "Email o contrasena incorrectos"
          : authError.message,
      );
      return;
    }

    await ensureProfile();
    window.location.href = next;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    setMagicLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
          {isAdmin ? "Admin" : "Iniciar sesion"}
        </h1>
        <p className={styles.subtitle}>
          {isAdmin
            ? "Acceso restringido."
            : "Introduce tus credenciales para acceder."}
        </p>

        {/* ── Password login ── */}
        <form onSubmit={handlePasswordLogin} className={styles.form}>
          <div>
            <label htmlFor="login-email" className="sr-only">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading || magicLoading}
              className={styles.input}
              autoComplete="email"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="sr-only">Contrasena</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contrasena"
              required
              disabled={loading}
              className={styles.input}
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={styles.button}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && <p id="login-error" className={styles.error} role="alert">{error}</p>}
        </form>

        {/* ── Separator ── */}
        <div className={styles.separator}>o</div>

        {/* ── Magic link ── */}
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
            <button
              type="submit"
              disabled={magicLoading || !email}
              className={styles.buttonSecondary}
            >
              {magicLoading ? "Enviando..." : "Enviar magic link"}
            </button>
            {magicError && <p className={styles.error} role="alert">{magicError}</p>}
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
