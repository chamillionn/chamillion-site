"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "48px 24px",
        textAlign: "center",
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
      <div>
        <h2
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Algo salio mal
        </h2>
        <p
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            maxWidth: 400,
          }}
        >
          Se produjo un error al cargar esta pagina. Puede ser un problema temporal de conexion con la base de datos.
        </p>
      </div>
      <code
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 11,
          color: "var(--red)",
          background: "rgba(199, 85, 90, 0.08)",
          border: "1px solid rgba(199, 85, 90, 0.2)",
          borderRadius: 6,
          padding: "6px 12px",
          maxWidth: 480,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {error.message}
      </code>
      <button
        onClick={reset}
        style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 12,
          letterSpacing: "0.3px",
          padding: "8px 20px",
          background: "var(--steel-blue)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          transition: "opacity 0.2s",
          marginTop: 4,
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Reintentar
      </button>
    </div>
  );
}
