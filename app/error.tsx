"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-dark)",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--red)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Algo salio mal
        </h1>
        <p
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: 15,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Se produjo un error inesperado. Puede ser un problema temporal.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={reset}
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 12,
              letterSpacing: "0.3px",
              padding: "10px 22px",
              background: "var(--steel-blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Reintentar
          </button>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 12,
              letterSpacing: "0.3px",
              padding: "10px 22px",
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
