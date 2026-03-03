"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "@/app/admin/crud.module.css";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }

      // Focus trap: cycle Tab between focusable elements inside modal
      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;

        const focusable = modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;

    // Save current focus and move into modal
    previousFocus.current = document.activeElement;
    const modal = modalRef.current;
    if (modal) {
      const firstBtn = modal.querySelector<HTMLElement>("button:not([disabled])");
      firstBtn?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus
      if (previousFocus.current instanceof HTMLElement) {
        previousFocus.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className={styles.modalTitle}>{title}</h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div className={styles.formActions}>
          <button
            className={styles.btnSecondary}
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            style={danger ? { background: "var(--red)" } : undefined}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
