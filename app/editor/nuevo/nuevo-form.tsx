"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDraftPost } from "@/app/admin/newsletter/actions";
import styles from "./nuevo.module.css";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NuevoForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createDraftPost({ title, slug });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/editor/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Título
        </label>
        <input
          id="title"
          className={styles.input}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej. Navegar las finanzas modernas"
          required
          autoFocus
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          className={`${styles.input} ${styles.inputMono}`}
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugEdited(true);
          }}
          placeholder="navegar-las-finanzas-modernas"
          pattern="[a-z0-9][a-z0-9-]*"
          required
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submit}
          disabled={pending || !title || !slug}
        >
          {pending ? "Creando…" : "Crear y abrir editor"}
        </button>
      </div>
    </form>
  );
}
