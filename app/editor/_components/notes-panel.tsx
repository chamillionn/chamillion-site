"use client";

import type { Editor } from "@tiptap/react";
import type { NoteRef, FieldNoteRef } from "./extensions/notes";
import styles from "./editor.module.css";

interface NotesPanelProps {
  editor: Editor | null;
  notes: NoteRef[];
  fieldNotes: FieldNoteRef[];
}

const FIELD_INPUT_ID: Record<FieldNoteRef["source"], string> = {
  title: "ph-title-input",
  subtitle: "ph-subtitle-input",
};

const FIELD_LABEL: Record<FieldNoteRef["source"], string> = {
  title: "TÍTULO",
  subtitle: "SUBT",
};

export default function NotesPanel({ editor, notes, fieldNotes }: NotesPanelProps) {
  function jumpToEditor(ref: NoteRef) {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: ref.from, to: ref.to })
      .scrollIntoView()
      .run();
  }

  function jumpToField(ref: FieldNoteRef) {
    const el = document.getElementById(FIELD_INPUT_ID[ref.source]);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Selecciona el texto del bracket para localización visual
    if (el instanceof HTMLInputElement) {
      const idx = el.value.indexOf(`[${ref.text}]`);
      if (idx !== -1) {
        window.requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(idx, idx + ref.text.length + 2);
        });
      } else {
        el.focus();
      }
    } else {
      el.focus();
    }
  }

  const total = notes.length + fieldNotes.length;

  return (
    <aside className={styles.notesPanel} aria-label="Notas del borrador">
      <div className={styles.notesHeader}>
        <h2 className={styles.sidebarTitle}>Notas</h2>
        <span className={styles.notesCount}>{total.toLocaleString("es-ES")}</span>
      </div>

      {total === 0 ? (
        <p className={styles.notesEmpty}>
          Escribe <code>[algo]</code> en el cuerpo, título o subtítulo para
          dejar una nota. Aparecerán aquí con link para saltar al sitio.
        </p>
      ) : (
        <ul className={styles.notesList}>
          {fieldNotes.map((n, i) => (
            <li key={`field-${n.source}-${i}`}>
              <button
                type="button"
                className={styles.noteItem}
                onClick={() => jumpToField(n)}
                title={`Saltar al ${n.source === "title" ? "título" : "subtítulo"}`}
              >
                <span className={styles.noteIdx}>{FIELD_LABEL[n.source]}</span>
                <span className={styles.noteText}>{n.text}</span>
              </button>
            </li>
          ))}
          {notes.map((n, i) => (
            <li key={`doc-${n.from}-${i}`}>
              <button
                type="button"
                className={styles.noteItem}
                onClick={() => jumpToEditor(n)}
                title="Saltar a la nota"
              >
                <span className={styles.noteIdx}>{fieldNotes.length + i + 1}</span>
                <span className={styles.noteText}>{n.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
