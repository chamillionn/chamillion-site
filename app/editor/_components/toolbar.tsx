"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import InsertModal from "./insert-modal";
import {
  IconH2,
  IconH3,
  IconBold,
  IconItalic,
  IconUnderline,
  IconCode,
  IconLink,
  IconBulletList,
  IconOrderedList,
  IconQuote,
  IconCallout,
  IconImage,
  IconWidget,
  IconDivider,
} from "./icons";
import styles from "./editor.module.css";

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

function Btn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.tbBtn} ${active ? styles.tbBtnActive : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active ?? undefined}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className={styles.tbDiv} aria-hidden="true" />;
}

type ModalKind = null | "link" | "image" | "widget";

export default function Toolbar({ editor, disabled }: ToolbarProps) {
  const [modal, setModal] = useState<ModalKind>(null);

  if (!editor) return null;
  const d = disabled ?? false;

  function closeModal() {
    setModal(null);
    editor?.chain().focus().run();
  }

  const linkCurrent = editor.isActive("link")
    ? ((editor.getAttributes("link").href as string) ?? "")
    : "";
  const widgetCurrent = editor.isActive("widget")
    ? (editor.getAttributes("widget") as {
        name?: string;
        description?: string;
      })
    : null;

  return (
    <>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Herramientas de formato"
      >
        <Btn
          title="Encabezado 2"
          active={editor.isActive("heading", { level: 2 })}
          disabled={d}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <IconH2 className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Encabezado 3"
          active={editor.isActive("heading", { level: 3 })}
          disabled={d}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <IconH3 className={styles.tbIcon} />
        </Btn>

        <Divider />

        <Btn
          title="Negrita (⌘B)"
          active={editor.isActive("bold")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Cursiva (⌘I)"
          active={editor.isActive("italic")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Subrayado (⌘U)"
          active={editor.isActive("underline")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <IconUnderline className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Código inline"
          active={editor.isActive("code")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <IconCode className={styles.tbIcon} />
        </Btn>

        <Divider />

        <Btn
          title="Enlace (⌘K)"
          active={editor.isActive("link")}
          disabled={d}
          onClick={() => setModal("link")}
        >
          <IconLink className={styles.tbIcon} />
        </Btn>

        <Divider />

        <Btn
          title="Lista con viñetas"
          active={editor.isActive("bulletList")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <IconBulletList className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <IconOrderedList className={styles.tbIcon} />
        </Btn>

        <Divider />

        <Btn
          title="Cita (pullquote)"
          active={editor.isActive("blockquote")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <IconQuote className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Nota destacada (callout)"
          active={editor.isActive("callout")}
          disabled={d}
          onClick={() => editor.chain().focus().toggleCallout().run()}
        >
          <IconCallout className={styles.tbIcon} />
        </Btn>

        <Divider />

        <Btn title="Imagen" disabled={d} onClick={() => setModal("image")}>
          <IconImage className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Widget placeholder (⌘⇧K)"
          active={editor.isActive("widget")}
          disabled={d}
          onClick={() => setModal("widget")}
        >
          <IconWidget className={styles.tbIcon} />
        </Btn>
        <Btn
          title="Separador"
          disabled={d}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <IconDivider className={styles.tbIcon} />
        </Btn>
      </div>

      {modal === "link" && (
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
            setModal(null);
          }}
          onClose={closeModal}
        />
      )}

      {modal === "image" && (
        <InsertModal
          title="Insertar imagen"
          fields={[
            {
              name: "src",
              label: "URL o ruta",
              placeholder: "/assets/newsletter/imagen.jpg",
              required: true,
              mono: true,
            },
            {
              name: "alt",
              label: "Alt (descripción)",
              placeholder: "Qué muestra la imagen",
            },
            {
              name: "caption",
              label: "Caption (opcional)",
              placeholder: "Pie de foto",
            },
          ]}
          onSubmit={({ src, alt, caption }) => {
            editor
              .chain()
              .focus()
              .setImage({
                src: src.trim(),
                alt: alt || undefined,
                title: caption || undefined,
              })
              .run();
            setModal(null);
          }}
          onClose={closeModal}
        />
      )}

      {modal === "widget" && (
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
              hint: "Será la referencia que use Claude para construir el widget después.",
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
            setModal(null);
          }}
          onClose={closeModal}
        />
      )}
    </>
  );
}
