"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const isAdmin = next.startsWith("/admin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Magic link state
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState("");

  async function ensureProfile() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email!,
        role: "free",
      });
    }
  }

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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className={styles.input}
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contrasena"
            required
            className={styles.input}
          />
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={styles.button}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
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
              className={styles.button}
            >
              {magicLoading ? "Enviando..." : "Enviar magic link"}
            </button>
            {magicError && <p className={styles.error}>{magicError}</p>}
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
