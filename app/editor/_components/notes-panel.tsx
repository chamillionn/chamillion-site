"use client";

import type { Editor } from "@tiptap/react";
import type { NoteRef } from "./extensions/notes";
import styles from "./editor.module.css";

interface NotesPanelProps {
  editor: Editor | null;
  notes: NoteRef[];
}

export default function NotesPanel({ editor, notes }: NotesPanelProps) {
  function jumpTo(ref: NoteRef) {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: ref.from, to: ref.to })
      .scrollIntoView()
      .run();
  }

  return (
    <aside className={styles.notesPanel} aria-label="Notas del borrador">
      <div className={styles.notesHeader}>
        <h2 className={styles.sidebarTitle}>Notas</h2>
        <span className={styles.notesCount}>
          {notes.length.toLocaleString("es-ES")}
        </span>
      </div>

      {notes.length === 0 ? (
        <p className={styles.notesEmpty}>
          Escribe <code>[algo]</code> dentro del texto para dejar una nota.
          Aparecerán aquí con link para saltar al sitio.
        </p>
      ) : (
        <ul className={styles.notesList}>
          {notes.map((n, i) => (
            <li key={`${n.from}-${i}`}>
              <button
                type="button"
                className={styles.noteItem}
                onClick={() => jumpTo(n)}
                title="Saltar a la nota"
              >
                <span className={styles.noteIdx}>{i + 1}</span>
                <span className={styles.noteText}>{n.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
