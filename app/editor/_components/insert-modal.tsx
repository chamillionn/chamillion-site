"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./editor.module.css";

export interface Field {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
  initial?: string;
  type?: "text" | "url";
  hint?: string;
}

interface InsertModalProps {
  title: string;
  fields: Field[];
  submitLabel?: string;
  children?: React.ReactNode;
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}

/**
 * Modal inline reutilizable para insertar recursos (imagen, widget, enlace, banner).
 * Sustituye los window.prompt() encadenados por un formulario único styled.
 */
export default function InsertModal({
  title,
  fields,
  submitLabel = "Insertar",
  children,
  onSubmit,
  onClose,
}: InsertModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.initial ?? ""])),
  );
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) return;
    }
    onSubmit(values);
  }

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.modalCard}
      >
        <h3 className={styles.modalTitle}>{title}</h3>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {fields.map((f, idx) => (
            <div key={f.name} className={styles.field}>
              <label className={styles.fieldLabel} htmlFor={`im-${f.name}`}>
                {f.label}
                {f.required && <span aria-hidden="true"> *</span>}
              </label>
              <input
                id={`im-${f.name}`}
                ref={idx === 0 ? firstRef : null}
                type={f.type ?? "text"}
                className={`${styles.input} ${f.mono ? styles.inputMono : ""}`}
                value={values[f.name] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.name]: e.target.value }))
                }
                placeholder={f.placeholder}
                required={f.required}
              />
              {f.hint && <p className={styles.fieldHint}>{f.hint}</p>}
            </div>
          ))}
          {children}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
