import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

export interface NoteRef {
  /** Texto dentro de los brackets (sin los `[` `]`). */
  text: string;
  /** Posición absoluta del `[` dentro del doc. */
  from: number;
  /** Posición absoluta del `]` + 1 dentro del doc. */
  to: number;
}

export interface FieldNoteRef {
  text: string;
  /** Origen del string (campo fuera del editor). */
  source: "title" | "subtitle";
}

const NOTE_RE = /\[([^[\]\n]+)\]/g;

/** Extrae `[algo]` de un string arbitrario (título, subtítulo, etc.). */
export function extractFieldNotes(
  value: string | null | undefined,
  source: "title" | "subtitle",
): FieldNoteRef[] {
  if (!value) return [];
  const refs: FieldNoteRef[] = [];
  NOTE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NOTE_RE.exec(value)) !== null) {
    refs.push({ text: match[1], source });
  }
  return refs;
}

function buildDecorations(doc: PMNode): { decos: DecorationSet; refs: NoteRef[] } {
  const decorations: Decoration[] = [];
  const refs: NoteRef[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    NOTE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = NOTE_RE.exec(text)) !== null) {
      const from = pos + match.index;
      const to = from + match[0].length;
      decorations.push(
        Decoration.inline(from, to, { class: "editor-note" }),
      );
      refs.push({ text: match[1], from, to });
    }
  });

  return { decos: DecorationSet.create(doc, decorations), refs };
}

export const notesKey = new PluginKey<{ decos: DecorationSet; refs: NoteRef[] }>(
  "notes",
);

/**
 * Detecta y resalta inline notas con la sintaxis `[...]`. No modifica el
 * documento — sólo añade decoraciones. Publica las referencias en el plugin
 * state para que un componente React pueda leerlas vía `notesKey.getState()`.
 *
 * El serializador de markdown ignora las decoraciones, así que las notas
 * round-trippean como texto plano (`[algo]`).
 */
export const Notes = Extension.create({
  name: "notes",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: notesKey,
        state: {
          init(_config, { doc }) {
            return buildDecorations(doc);
          },
          apply(tr, old) {
            if (!tr.docChanged) return old;
            return buildDecorations(tr.doc);
          },
        },
        props: {
          decorations(state) {
            return notesKey.getState(state)?.decos ?? null;
          },
        },
      }),
    ];
  },
});
