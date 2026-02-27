"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Post } from "@/lib/supabase/types";
import { togglePostPremium, togglePostPublished } from "./actions";
import styles from "../crud.module.css";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked
          ? "var(--steel-blue)"
          : "rgba(var(--steel-blue-rgb), 0.15)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export default function NewsletterTable({ posts }: { posts: Post[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePremium(id: string, value: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await togglePostPremium(id, value);
      if (res.error) setError(res.error);
    });
  }

  function handlePublished(id: string, value: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await togglePostPublished(id, value);
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <div className={styles.toolbar}>
        <h1 className={styles.heading}>Newsletter</h1>
      </div>

      {error && <p className={styles.formError} style={{ marginBottom: 12 }}>{error}</p>}

      {posts.length === 0 ? (
        <div className={styles.empty}>No hay posts todavía.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha</th>
                <th>Slug</th>
                <th>Premium</th>
                <th>Publicado</th>
                <th>Ver</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className={styles.bold}>{post.title}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11 }}>
                      {post.date}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        maxWidth: 220,
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        verticalAlign: "middle",
                      }}
                    >
                      {post.slug}
                    </span>
                  </td>
                  <td>
                    <Toggle
                      checked={post.premium}
                      onChange={(v) => handlePremium(post.id, v)}
                      disabled={pending}
                    />
                  </td>
                  <td>
                    <Toggle
                      checked={post.published}
                      onChange={(v) => handlePublished(post.id, v)}
                      disabled={pending}
                    />
                  </td>
                  <td>
                    <Link
                      href={`/newsletter/${post.slug}`}
                      target="_blank"
                      className={styles.link}
                    >
                      ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
