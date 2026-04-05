"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ensureProfile, completeTransfer } from "./actions";
import styles from "./page.module.css";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") || "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isSignup = type === "signup";
  const missing = !tokenHash || !type;

  async function handleConfirm() {
    if (missing) return;
    setError(false);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (verifyError) {
      setLoading(false);
      setError(true);
      return;
    }

    await ensureProfile();

    // Generate a transfer token so the original device can auto-authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      await completeTransfer(user.email);
    }

    router.push(next);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image
          src="/assets/newsletter/logo.jpg"
          alt="Chamillion"
          width={64}
          height={64}
          className={styles.logo}
        />

        {missing ? (
          <>
            <h1 className={styles.title}>Enlace no valido</h1>
            <p className={styles.subtitle}>
              El enlace no contiene los datos necesarios. Solicita uno nuevo.
            </p>
            <Link href="/login" className={styles.link}>
              Ir a iniciar sesion
            </Link>
          </>
        ) : error ? (
          <>
            <h1 className={styles.title}>Enlace expirado</h1>
            <p className={styles.subtitle}>
              El enlace ha expirado o ya se ha utilizado. Solicita uno nuevo.
            </p>
            <Link href="/login" className={styles.link}>
              Solicitar nuevo enlace
            </Link>
          </>
        ) : (
          <>
            <h1 className={styles.title}>
              {isSignup ? "Confirmar cuenta" : "Iniciar sesion"}
            </h1>
            <p className={styles.subtitle}>
              {isSignup
                ? "Pulsa el boton para confirmar tu email y acceder."
                : "Pulsa el boton para acceder a Chamillion."}
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={styles.button}
            >
              {loading
                ? "Verificando..."
                : isSignup
                  ? "Confirmar email"
                  : "Acceder"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
