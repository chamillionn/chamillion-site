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
import { exitReadOnlyMode } from "@/app/admin/actions";
import { Callout } from "./extensions/callout";
import { Widget } from "./extensions/widget";
import { SlashCommands } from "./extensions/slash-commands";
import { Notes, notesKey, extractFieldNotes, type NoteRef } from "./extensions/notes";
import { Polymarket } from "./extensions/polymarket";
import { Tweet } from "./extensions/tweet";
import { HeadingWithId } from "./extensions/heading-with-id";
import { extractTocEntries, type TocEntry } from "./toc-utils";
import TocSidebar from "@/app/newsletter/toc-sidebar";
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
  // Mantén "Guardando…" y el flash de "Guardado" visibles al menos 600 ms
  // para que no parpadeen en saves rápidos.
  const [displayStatus, setDisplayStatus] = useState<SaveStatus>(status);
  const [justSaved, setJustSaved] = useState(false);
  const prevStatus = useRef<SaveStatus>(status);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (status === "saving") {
      setDisplayStatus("saving");
      return;
    }
    if (status === "saved" && prev === "saving") {
      // Flash "guardado" brevemente con estilo destacado
      setJustSaved(true);
      setDisplayStatus("saved");
      const t = setTimeout(() => setJustSaved(false), 1400);
      return () => clearTimeout(t);
    }
    setDisplayStatus(status);
  }, [status]);

  const content = (() => {
    if (displayStatus === "saving")
      return {
        cls: styles.statusSaving,
        dot: styles.dotSaving,
        text: "Guardando…",
      };
    if (displayStatus === "error")
      return {
        cls: styles.statusError,
        dot: styles.dotError,
        text: `Error: ${err ?? "no se pudo guardar"}`,
      };
    if (displayStatus === "saved")
      return {
        cls: justSaved ? styles.statusJustSaved : styles.statusSaved,
        dot: styles.dotSaved,
        text: justSaved ? "✓ Guardado" : `Guardado ${formatSavedAgo(savedAt)}`,
      };
    return { cls: "", dot: styles.dotIdle, text: "Sin cambios" };
  })();

  return (
    <span
      className={`${styles.status} ${content.cls}`}
      role="status"
      aria-live="polite"
    >
      <span className={`${styles.statusDot} ${content.dot}`} aria-hidden="true" />
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

  // Backup local (declarado al principio para estar disponible en los
  // useEffects y callbacks de abajo).
  const backupKey = `editor-backup-${post.id}`;
  const [pendingBackup, setPendingBackup] = useState<{
    json: unknown;
    ts: number;
  } | null>(null);

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

  // Detectar backup local más reciente que el server al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { json: unknown; ts: number };
      const serverTs = post.draft_updated_at
        ? new Date(post.draft_updated_at).getTime()
        : 0;
      // Tolerancia 2s: si el backup es posterior al último save conocido,
      // el user tiene cambios no sincronizados.
      if (parsed.ts > serverTs + 2000) {
        setPendingBackup(parsed);
      } else {
        localStorage.removeItem(backupKey);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando autosave confirma save exitoso, el backup queda obsoleto.
  useEffect(() => {
    if (autosave.status === "saved" && !pendingBackup) {
      try {
        localStorage.removeItem(backupKey);
      } catch {
        /* ignore */
      }
    }
  }, [autosave.status, backupKey, pendingBackup]);

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
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);

  // UI overlays
  const [linkModal, setLinkModal] = useState(false);
  const [widgetModal, setWidgetModal] = useState(false);
  const [shortcutSheet, setShortcutSheet] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: false }),
      // El <h1> del doc es el título del post (PostHeader lo envuelve
      // semánticamente). En el cuerpo solo permitimos H2–H4 para evitar
      // duplicar el H1 accidentalmente con `#` en markdown.
      HeadingWithId.configure({ levels: [2, 3, 4] }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Typography,
      Placeholder.configure({
        placeholder: "Empieza a escribir. Prueba /h2, /quote, /callout al principio de línea.",
      }),
      Callout,
      Widget,
      Polymarket,
      Tweet,
      SlashCommands,
      Notes,
      Markdown.configure({ html: false, tightLists: true }),
    ],
    content: initialJson,
    onUpdate: ({ editor }) => {
      // Solo tareas síncronas de UI. El autosave vive en un useEffect
      // separado (más abajo) para evitar stale closures.
      const text = editor.state.doc.textContent;
      setCounts({ words: countWords(text), chars: text.length });
      setNotes(notesKey.getState(editor.state)?.refs ?? []);
      setTocEntries(extractTocEntries(editor.state.doc));
    },
    onCreate: ({ editor }) => {
      const text = editor.state.doc.textContent;
      setCounts({ words: countWords(text), chars: text.length });
      setNotes(notesKey.getState(editor.state)?.refs ?? []);
      setTocEntries(extractTocEntries(editor.state.doc));
    },
  });

  // Subscripción de autosave con closure fresca (se re-subscribe si
  // cambian editor, readOnly o autosave). Así evitamos el stale closure
  // del onUpdate inline del useEditor.
  useEffect(() => {
    if (!editor) return;
    function handleUpdate() {
      if (!editor) return;
      console.log("[editor] update event", { readOnly });
      if (readOnly) return;
      try {
        localStorage.setItem(
          backupKey,
          JSON.stringify({ json: editor.getJSON(), ts: Date.now() }),
        );
      } catch {
        /* ignore */
      }
      autosave.schedule(() => {
        const storage = editor.storage as {
          markdown?: { getMarkdown: () => string };
        };
        let contentMd = "";
        try {
          contentMd = storage.markdown?.getMarkdown() ?? "";
        } catch (err) {
          console.warn("[editor] getMarkdown failed:", err);
        }
        return { contentJson: editor.getJSON(), contentMd };
      });
    }
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, readOnly, autosave, backupKey]);

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
    let md = "";
    try {
      md = storage.markdown?.getMarkdown() ?? "";
    } catch (err) {
      console.warn("[editor] getMarkdown failed:", err);
      toast("No se pudo serializar a markdown", "error");
      return;
    }
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

  function restoreBackup() {
    if (!pendingBackup || !editor) return;
    editor.commands.setContent(pendingBackup.json as JSONContent);
    setPendingBackup(null);
    autosave.flush();
  }

  function discardBackup() {
    try {
      localStorage.removeItem(backupKey);
    } catch {
      /* ignore */
    }
    setPendingBackup(null);
  }

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
      {tocEntries.length > 0 && (
        <div className={styles.tocWrap}>
          <TocSidebar entries={tocEntries} />
        </div>
      )}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <a href="/admin/newsletter" className={styles.backLink}>
              ← Newsletter
            </a>
            {readOnly && (
              <button
                type="button"
                className={styles.readOnlyChip}
                title="Cambiar al target nativo para poder editar"
                onClick={async () => {
                  const res = await exitReadOnlyMode();
                  if (res.error) {
                    toast(res.error, "error");
                    return;
                  }
                  window.location.reload();
                }}
                aria-label="Salir de modo lectura"
              >
                Solo lectura — click para editar
              </button>
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

        <Toolbar editor={editor} disabled={readOnly} slug={post.slug} />

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
          <NotesPanel
            editor={editor}
            notes={notes}
            fieldNotes={[
              ...extractFieldNotes(post.title, "title"),
              ...extractFieldNotes(post.subtitle, "subtitle"),
            ]}
          />
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

      {pendingBackup && (
        <div className={styles.modalOverlay} role="presentation">
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label="Cambios sin sincronizar"
          >
            <h3 className={styles.modalTitle}>Cambios no guardados</h3>
            <p
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: 13.5,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                margin: "0 0 16px",
              }}
            >
              Hay una versión local del borrador más reciente que la del servidor
              (guardada {formatSavedAgo(pendingBackup.ts)}). Probablemente
              corresponde a edits que no llegaron a sincronizarse.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={discardBackup}
              >
                Descartar local
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={restoreBackup}
              >
                Restaurar versión local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
