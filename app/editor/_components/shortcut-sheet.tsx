"use client";

import { useEffect } from "react";
import styles from "./editor.module.css";

interface Shortcut {
  keys: string;
  label: string;
}

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Guardar y ver",
    items: [
      { keys: "⌘ S", label: "Forzar guardado" },
      { keys: "⌘ ⇧ C", label: "Copiar markdown" },
      { keys: "⌘ .", label: "Mostrar/ocultar metadata" },
      { keys: "⌘ /", label: "Mostrar esta ayuda" },
    ],
  },
  {
    title: "Formato",
    items: [
      { keys: "⌘ B", label: "Negrita" },
      { keys: "⌘ I", label: "Cursiva" },
      { keys: "⌘ U", label: "Subrayado" },
      { keys: "⌘ K", label: "Enlace" },
    ],
  },
  {
    title: "Insertar (escribe al principio de línea)",
    items: [
      { keys: "/h2", label: "Encabezado 2" },
      { keys: "/h3", label: "Encabezado 3" },
      { keys: "/quote", label: "Cita / pullquote" },
      { keys: "/callout", label: "Nota destacada" },
      { keys: "/widget", label: "Placeholder de widget" },
      { keys: "/divider", label: "Separador" },
      { keys: "/image", label: "Imagen" },
    ],
  },
];

interface ShortcutSheetProps {
  onClose: () => void;
}

export default function ShortcutSheet({ onClose }: ShortcutSheetProps) {
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
        aria-label="Atajos de teclado"
        className={`${styles.modalCard} ${styles.modalWide}`}
      >
        <h3 className={styles.modalTitle}>Atajos</h3>
        <div className={styles.shortcutGroups}>
          {GROUPS.map((g) => (
            <section key={g.title} className={styles.shortcutGroup}>
              <h4 className={styles.shortcutGroupTitle}>{g.title}</h4>
              <ul className={styles.shortcutList}>
                {g.items.map((s) => (
                  <li key={s.keys} className={styles.shortcutRow}>
                    <kbd className={styles.kbd}>{s.keys}</kbd>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
