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
    <div className="status-page">
      <div className="status-page-inner">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--red)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h1 className="status-page-title">Algo salio mal</h1>
        <p className="status-page-text">
          Se produjo un error inesperado. Puede ser un problema temporal.
        </p>
        <div className="status-page-actions">
          <button
            onClick={reset}
            className="status-page-btn status-page-btn-primary"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="status-page-btn status-page-btn-secondary"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
