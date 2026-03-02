"use client";

import crudStyles from "./crud.module.css";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "60px 40px", textAlign: "center" }}>
      <h2 className={crudStyles.heading} style={{ marginBottom: 12 }}>
        Error al cargar la pagina
      </h2>
      <p
        style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 24,
        }}
      >
        {error.message}
      </p>
      <button onClick={reset} className={crudStyles.btnSecondary}>
        Reintentar
      </button>
    </div>
  );
}
