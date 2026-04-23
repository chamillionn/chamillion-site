"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";
import type { Post } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { saveDraftContent } from "@/app/admin/newsletter/actions";
import { Callout } from "./extensions/callout";
import { Widget } from "./extensions/widget";
import { SlashCommands } from "./extensions/slash-commands";
import { Notes, notesKey, type NoteRef } from "./extensions/notes";
import {
  useAutosave,
  formatSavedAgo,
  type SaveStatus,
} from "./use-autosave";
import Toolbar from "./toolbar";
import MetadataPanel from "./metadata-panel";
import NotesPanel from "./notes-panel";
import PostHeader from "./post-header";
import InsertModal from "./insert-modal";
import ShortcutSheet from "./shortcut-sheet";
import styles from "./editor.module.css";

interface EditorProps {
  post: Post;
  readOnly: boolean;
  bannerOptions: string[];
}

function StatusLabel({
  status,
  savedAt,
  err,
}: {
  status: SaveStatus;
  savedAt: number | null;
  err: string | null;
}) {
  const content = (() => {
    if (status === "saving") return { cls: styles.statusSaving, text: "Guardando…" };
    if (status === "error")
      return {
        cls: styles.statusError,
        text: `Error: ${err ?? "no se pudo guardar"}`,
      };
    if (status === "saved")
      return {
        cls: styles.statusSaved,
        text: `Guardado ${formatSavedAgo(savedAt)}`,
      };
    return { cls: "", text: "Sin cambios" };
  })();
  return (
    <span
      className={`${styles.status} ${content.cls}`}
      role="status"
      aria-live="polite"
    >
      {content.text}
    </span>
  );
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function Editor({ post, readOnly, bannerOptions }: EditorProps) {
  const { toast } = useToast();
  const initialJson = (post.content_json as JSONContent | null) ?? undefined;

  const autosave = useAutosave({
    onSave: async (payload) => saveDraftContent(post.id, payload),
  });

  // Tick cada 15s, pausado cuando la pestaña está oculta.
  const [, setTick] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (id !== null) return;
      id = setInterval(() => setTick((t) => t + 1), 15000);
    }
    function stop() {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    }
    if (document.visibilityState === "visible") start();
    function onVis() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Sidebar colapsable — persistida en localStorage.
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  useEffect(() => {
    const v = localStorage.getItem("editor:sidebar-open");
    if (v !== null) setSidebarOpen(v === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("editor:sidebar-open", sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  // Word/char count sobre el plain text actual.
  const [counts, setCounts] = useState({ words: 0, chars: 0 });
  const [notes, setNotes] = useState<NoteRef[]>([]);

  // UI overlays
  const [linkModal, setLinkModal] = useState(false);
  const [widgetModal, setWidgetModal] = useState(false);
  const [shortcutSheet, setShortcutSheet] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Typography,
      Placeholder.configure({
        placeholder: "Empieza a escribir. Prueba /h2, /quote, /callout al principio de línea.",
      }),
      Callout,
      Widget,
      SlashCommands,
      Notes,
      Markdown.configure({ html: false, tightLists: true }),
    ],
    content: initialJson,
    onUpdate: ({ editor }) => {
      const text = editor.state.doc.textContent;
      setCounts({ words: countWords(text), chars: text.length });
      setNotes(notesKey.getState(editor.state)?.refs ?? []);
      if (readOnly) return;
      // La serialización a MD/JSON se pospone al momento de flush en autosave
      // (ver schedule callback abajo).
      autosave.schedule(() => {
        const storage = editor.storage as {
          markdown?: { getMarkdown: () => string };
        };
        return {
          contentJson: editor.getJSON(),
          contentMd: storage.markdown?.getMarkdown() ?? "",
        };
      });
    },
    onCreate: ({ editor }) => {
      const text = editor.state.doc.textContent;
      setCounts({ words: countWords(text), chars: text.length });
      setNotes(notesKey.getState(editor.state)?.refs ?? []);
    },
  });

  // -- Keyboard shortcuts global --
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        autosave.flush();
        return;
      }
      if (key === "/") {
        e.preventDefault();
        setShortcutSheet((s) => !s);
        return;
      }
      if (key === "." ) {
        e.preventDefault();
        setSidebarOpen((s) => !s);
        return;
      }
      if (key === "k" && !e.shiftKey) {
        if (!editor || readOnly) return;
        e.preventDefault();
        setLinkModal(true);
        return;
      }
      if (key === "k" && e.shiftKey) {
        if (!editor || readOnly) return;
        e.preventDefault();
        setWidgetModal(true);
        return;
      }
      if (key === "c" && e.shiftKey) {
        e.preventDefault();
        void copyMarkdown();
        return;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, readOnly, autosave]);

  const copyMarkdown = useCallback(async () => {
    if (!editor) return;
    const storage = editor.storage as {
      markdown?: { getMarkdown: () => string };
    };
    const md = storage.markdown?.getMarkdown() ?? "";
    try {
      await navigator.clipboard.writeText(md);
      toast("Markdown copiado", "success");
    } catch {
      toast("No se pudo copiar al portapapeles", "error");
    }
  }, [editor, toast]);

  const saveNow = useCallback(() => {
    autosave.flush();
  }, [autosave]);

  // Current link/widget attrs for modals
  const linkCurrent = useMemo(() => {
    if (!editor || !editor.isActive("link")) return "";
    return (editor.getAttributes("link").href as string) ?? "";
  }, [editor, linkModal]); // eslint-disable-line react-hooks/exhaustive-deps
  const widgetCurrent = useMemo(() => {
    if (!editor || !editor.isActive("widget")) return null;
    return editor.getAttributes("widget") as {
      name?: string;
      description?: string;
    };
  }, [editor, widgetModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Topbar overflow menu (Copiar MD)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div className={`${styles.shell} ${sidebarOpen ? "" : styles.shellSolo}`}>
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <a href="/admin/newsletter" className={styles.backLink}>
              ← Newsletter
            </a>
            {readOnly && (
              <span
                className={styles.readOnlyChip}
                role="status"
                aria-live="polite"
              >
                Solo lectura
              </span>
            )}
          </div>
          <div className={styles.topbarRight}>
            <span
              className={styles.wordCount}
              aria-label={`${counts.words} palabras, ${counts.chars} caracteres`}
            >
              {counts.words.toLocaleString("es-ES")} pal · {counts.chars.toLocaleString("es-ES")} car
            </span>
            <StatusLabel
              status={autosave.status}
              savedAt={autosave.savedAt}
              err={autosave.errorMsg}
            />
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShortcutSheet(true)}
              title="Atajos de teclado (⌘/)"
              aria-label="Ver atajos de teclado"
            >
              ?
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setSidebarOpen((s) => !s)}
              title={sidebarOpen ? "Ocultar metadata (⌘.)" : "Mostrar metadata (⌘.)"}
              aria-label={sidebarOpen ? "Ocultar metadata" : "Mostrar metadata"}
              aria-pressed={sidebarOpen}
            >
              {sidebarOpen ? "◨" : "◧"}
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={saveNow}
              disabled={!editor || readOnly || autosave.status === "saving"}
              title="Guardar (⌘S)"
            >
              Guardar
            </button>
            <div className={styles.menuWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setMenuOpen((m) => !m)}
                title="Más acciones"
                aria-label="Más acciones"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                ⋯
              </button>
              {menuOpen && (
                <div className={styles.menu} role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      void copyMarkdown();
                    }}
                  >
                    Copiar markdown
                    <kbd className={styles.kbdInline}>⌘⇧C</kbd>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Toolbar editor={editor} disabled={readOnly} />

        <PostHeader post={post} readOnly={readOnly} bannerOptions={bannerOptions} />

        <div className={styles.canvas}>
          <div className={styles.editor}>
            <EditorContent editor={editor} aria-label="Cuerpo del post" />
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div className={styles.sidebarCol}>
          <MetadataPanel post={post} readOnly={readOnly} />
          <NotesPanel editor={editor} notes={notes} />
        </div>
      )}

      {linkModal && editor && (
        <InsertModal
          title={linkCurrent ? "Editar enlace" : "Insertar enlace"}
          fields={[
            {
              name: "url",
              label: "URL",
              placeholder: "https://…",
              required: true,
              type: "url",
              initial: linkCurrent,
              mono: true,
            },
          ]}
          submitLabel={linkCurrent ? "Actualizar" : "Insertar"}
          onSubmit={({ url }) => {
            const chain = editor.chain().focus().extendMarkRange("link");
            if (url.trim()) chain.setLink({ href: url.trim() }).run();
            else chain.unsetLink().run();
            setLinkModal(false);
          }}
          onClose={() => setLinkModal(false)}
        />
      )}

      {widgetModal && editor && (
        <InsertModal
          title={widgetCurrent ? "Editar widget" : "Insertar widget placeholder"}
          fields={[
            {
              name: "name",
              label: "Identificador",
              placeholder: "eur-value, retail-flows, …",
              required: true,
              mono: true,
              initial: widgetCurrent?.name ?? "",
            },
            {
              name: "description",
              label: "Descripción",
              placeholder: "Qué debería mostrar o hacer",
              initial: widgetCurrent?.description ?? "",
              hint: "Será la referencia para construir el widget después.",
            },
          ]}
          submitLabel={widgetCurrent ? "Actualizar" : "Insertar"}
          onSubmit={({ name, description }) => {
            if (widgetCurrent) {
              editor
                .chain()
                .focus()
                .updateAttributes("widget", {
                  name: name.trim(),
                  description: description.trim(),
                })
                .run();
            } else {
              editor
                .chain()
                .focus()
                .insertWidget({
                  name: name.trim(),
                  description: description.trim(),
                })
                .run();
            }
            setWidgetModal(false);
          }}
          onClose={() => setWidgetModal(false)}
        />
      )}

      {shortcutSheet && <ShortcutSheet onClose={() => setShortcutSheet(false)} />}
    </div>
  );
}
