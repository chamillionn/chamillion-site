"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadBannerImage } from "@/app/admin/newsletter/actions";
import styles from "./editor.module.css";

const ASPECT_OPTIONS = [
  { value: "4 / 1", label: "Extra-wide · 4:1 (cinemascope)" },
  { value: "3 / 1", label: "Wide · 3:1 (default web)" },
  { value: "2 / 1", label: "Estándar · 2:1" },
  { value: "16 / 9", label: "Video · 16:9" },
  { value: "14 / 10", label: "Substack · 14:10" },
];

const DEFAULT_ASPECT = "3 / 1";

interface BannerPickerModalProps {
  /** Paths disponibles (ej. /assets/newsletter/banner-post-01.jpeg). */
  options: string[];
  /** Slug del post actual, usado para nombrar el archivo subido. */
  slug: string;
  initial?: string;
  initialAspect?: string | null;
  onSubmit: (payload: { path: string; aspect: string }) => void;
  onClose: () => void;
}

export default function BannerPickerModal({
  options,
  slug,
  initial = "",
  initialAspect,
  onSubmit,
  onClose,
}: BannerPickerModalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(initial);
  const [custom, setCustom] = useState(
    initial && !options.includes(initial) ? initial : "",
  );
  const [aspect, setAspect] = useState<string>(initialAspect || DEFAULT_ASPECT);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
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
      const res = await uploadBannerImage(fd);
      if (res.error) {
        setUploadError(res.error);
        return;
      }
      if (res.path) {
        // Seleccionar directamente el nuevo banner y aplicar.
        setSelected(res.path);
        setCustom("");
        onSubmit({ path: res.path, aspect });
        router.refresh(); // re-fetchea bannerOptions en el server component
      }
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset para permitir re-subir el mismo archivo
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = custom.trim() || selected;
    if (!path) return;
    // Cache-bust si no trae ya una version (selección del grid o custom path).
    // Los headers `Cache-Control: immutable` de /assets/* harían que el
    // browser no vuelva a pedir un mismo path aunque el fichero cambie.
    const finalPath = path.includes("?") ? path : `${path}?v=${Date.now()}`;
    onSubmit({ path: finalPath, aspect });
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
        aria-label="Elegir banner"
        className={`${styles.modalCard} ${styles.modalWide}`}
      >
        <h3 className={styles.modalTitle}>Banner del post</h3>

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
              aria-label="Subir banner"
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
                    jpg · png · webp · avif · máx 8&nbsp;MB · se guarda como{" "}
                    <code>banner-{slug || "…"}.ext</code>
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

          {/* EXISTING */}
          {options.length > 0 && (
            <div className={styles.field}>
              <p className={styles.fieldLabel}>O elegir existente</p>
              <div className={styles.bannerGrid}>
                {options.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`${styles.bannerOption} ${selected === opt && !custom ? styles.bannerOptionActive : ""}`}
                    onClick={() => {
                      setSelected(opt);
                      setCustom("");
                    }}
                    aria-pressed={selected === opt && !custom}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={opt} alt={opt} className={styles.bannerOptionImg} />
                    <span className={styles.bannerOptionPath}>{opt.split("/").pop()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM PATH */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="banner-custom">
              O path personalizado
            </label>
            <input
              id="banner-custom"
              className={`${styles.input} ${styles.inputMono}`}
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                if (e.target.value) setSelected("");
              }}
              placeholder="/assets/newsletter/banner-post-XX.jpeg"
            />
          </div>

          {/* ASPECT RATIO */}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="banner-aspect">
              Proporción
            </label>
            <select
              id="banner-aspect"
              className={styles.select}
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
            >
              {ASPECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className={styles.fieldHint}>
              Más ancho = más bajo. El default (3:1) es lo que usan los posts
              existentes.
            </p>
          </div>

          <div className={styles.modalActions}>
            {initial && (
              <button
                type="button"
                className={styles.btnSecondaryDanger}
                onClick={() => onSubmit({ path: "", aspect })}
                disabled={pending}
              >
                Quitar banner
              </button>
            )}
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
              disabled={pending || (!selected && !custom.trim())}
            >
              Usar este banner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
