"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { uploadInlineImage } from "@/app/admin/newsletter/actions";
import styles from "./editor.module.css";

interface ImageInsertModalProps {
  slug: string;
  onSubmit: (payload: { src: string; alt: string; caption?: string }) => void;
  onClose: () => void;
}

/**
 * Modal de "insertar imagen" con opción de subir archivo (va a
 * public/assets/newsletter/<slug>-<ts>.<ext>) o pegar URL directa.
 */
export default function ImageInsertModal({
  slug,
  onSubmit,
  onClose,
}: ImageInsertModalProps) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const altRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFile(file: File) {
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("slug", slug);
    startTransition(async () => {
      const res = await uploadInlineImage(fd);
      if (res.error) {
        setUploadError(res.error);
        return;
      }
      if (res.path) {
        setSrc(res.path);
        // Foco en alt para completar la descripción ya que es lo siguiente
        // que toca.
        window.requestAnimationFrame(() => altRef.current?.focus());
      }
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = src.trim();
    if (!clean) return;
    onSubmit({
      src: clean,
      alt: alt.trim(),
      caption: caption.trim() || undefined,
    });
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
        aria-label="Insertar imagen"
        className={`${styles.modalCard} ${styles.modalWide}`}
      >
        <h3 className={styles.modalTitle}>Insertar imagen</h3>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* UPLOAD */}
          <div className={styles.field}>
            <p className={styles.fieldLabel}>Subir imagen</p>
            <button
              type="button"
              className={styles.uploadDrop}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              disabled={pending}
              aria-label="Subir imagen"
            >
              {pending ? (
                <span className={styles.uploadPending}>Subiendo…</span>
              ) : (
                <>
                  <span className={styles.uploadIcon} aria-hidden="true">↑</span>
                  <span className={styles.uploadText}>
                    Click o arrastra una imagen
                  </span>
                  <span className={styles.uploadHint}>
                    jpg · png · webp · avif · máx 8 MB · se guarda como{" "}
                    <code>{slug || "img"}-&lt;ts&gt;.ext</code>
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.avif,image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
            {uploadError && <p className={styles.fieldError}>{uploadError}</p>}
          </div>

          {/* URL (si ya tienes una) */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="img-src">
              URL o ruta
            </label>
            <input
              id="img-src"
              className={`${styles.input} ${styles.inputMono}`}
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="/assets/newsletter/mi-imagen.jpg  (o URL externa)"
              required
            />
          </div>

          {/* ALT */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="img-alt">
              Alt (descripción)
            </label>
            <input
              id="img-alt"
              ref={altRef}
              className={styles.input}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Qué muestra la imagen"
            />
          </div>

          {/* CAPTION */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="img-caption">
              Caption (opcional)
            </label>
            <input
              id="img-caption"
              className={styles.input}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Pie de foto"
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={pending || !src.trim()}
            >
              Insertar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
