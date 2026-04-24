"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useToast } from "@/components/admin-toast";
import { updateDraftMetadata } from "@/app/admin/newsletter/actions";
import type { Post } from "@/lib/supabase/types";
import BannerPickerModal from "./banner-picker-modal";
import styles from "./editor.module.css";

interface PostHeaderProps {
  post: Post;
  readOnly: boolean;
  /** Paths disponibles en /public/assets/newsletter/ (solo banner-*.jpeg). */
  bannerOptions: string[];
}

function formatMeta(dateIso: string) {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    return d
      .toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(/\./g, "");
  } catch {
    return dateIso;
  }
}

export default function PostHeader({ post, readOnly, bannerOptions }: PostHeaderProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState(post.title);
  const [subtitle, setSubtitle] = useState(post.subtitle ?? "");
  const [bannerPath, setBannerPath] = useState(post.banner_path ?? "");
  const [bannerError, setBannerError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function save(patch: Parameters<typeof updateDraftMetadata>[1]) {
    if (readOnly) return;
    startTransition(async () => {
      const res = await updateDraftMetadata(post.id, patch);
      if (res.error) toast(res.error, "error");
    });
  }

  function onTitleBlur() {
    const next = title.trim();
    if (!next) {
      toast("El título no puede estar vacío", "error");
      setTitle(post.title);
      return;
    }
    if (next !== post.title) save({ title: next });
  }

  function onSubtitleBlur() {
    const next = subtitle.trim();
    if (next === (post.subtitle ?? "")) return;
    save({ subtitle: next || null });
  }

  function onPickerSubmit(nextPath: string) {
    setBannerPath(nextPath);
    setBannerError(false);
    save({ banner_path: nextPath || null });
    setPickerOpen(false);
  }

  return (
    <header className={styles.postHeader}>
      {/* BANNER */}
      <div className={styles.bannerSection}>
        <button
          type="button"
          className={`${styles.bannerWrapper} ${!bannerPath || bannerError ? styles.bannerEmpty : ""}`}
          onClick={() => !readOnly && setPickerOpen(true)}
          disabled={readOnly}
          title={
            readOnly
              ? "Solo lectura"
              : bannerPath
                ? "Click para cambiar el banner"
                : "Click para añadir banner"
          }
          aria-label={bannerPath ? "Cambiar banner" : "Añadir banner"}
        >
          {bannerPath && !bannerError ? (
            <Image
              className={styles.bannerImg}
              src={bannerPath}
              alt={title || "Banner"}
              width={1568}
              height={700}
              priority
              onError={() => setBannerError(true)}
            />
          ) : (
            <span className={styles.bannerPlaceholder}>
              <span className={styles.bannerPlaceholderIcon} aria-hidden="true">
                ⬚
              </span>
              <span className={styles.bannerPlaceholderText}>
                {bannerError ? "No se encontró la imagen" : "Añadir banner"}
              </span>
              <span className={styles.bannerPlaceholderHint}>
                {bannerError
                  ? `Ruta: ${bannerPath}`
                  : "3:1 · banner-post-XX.jpeg"}
              </span>
            </span>
          )}
        </button>
      </div>

      {/* ARTICLE HEADER */}
      <div className={styles.articleHeader}>
        <h1 className={styles.hTitle}>
          <input
            id="ph-title-input"
            type="text"
            className={styles.hTitleInput}
            value={title}
            disabled={readOnly}
            placeholder="Título del post"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onTitleBlur}
            aria-label="Título del post"
          />
        </h1>
        <p className={styles.hSubtitleWrap}>
          <input
            id="ph-subtitle-input"
            type="text"
            className={styles.hSubtitleInput}
            value={subtitle}
            disabled={readOnly}
            placeholder="Subtítulo (opcional)"
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={onSubtitleBlur}
            aria-label="Subtítulo del post"
          />
        </p>
        <div className={styles.postMeta}>{formatMeta(post.date)}</div>
      </div>

      <hr className={styles.dividerHeavy} />

      {pickerOpen && (
        <BannerPickerModal
          options={bannerOptions}
          slug={post.slug}
          initial={bannerPath}
          onSubmit={onPickerSubmit}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </header>
  );
}
