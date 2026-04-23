"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Post } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
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
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "premium">("all");

  const filtered = posts.filter((p) => {
    if (statusFilter === "published" && !p.published) return false;
    if (statusFilter === "draft" && p.published) return false;
    if (statusFilter === "premium" && !p.premium) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  });

  function handlePremium(id: string, value: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await togglePostPremium(id, value);
      if (res.error) { setError(res.error); toast(res.error, "error"); }
      else toast(value ? "Marcado premium" : "Premium desactivado", "success");
    });
  }

  function handlePublished(id: string, value: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await togglePostPublished(id, value);
      if (res.error) { setError(res.error); toast(res.error, "error"); }
      else toast(value ? "Post publicado" : "Post despublicado", "success");
    });
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar titulo o slug..."
            className={styles.input}
            style={{ width: 200, padding: "6px 10px", fontSize: 12 }}
          />
          {(["all", "published", "draft", "premium"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={styles.btnSecondary}
              style={statusFilter === f ? { borderColor: "var(--steel-blue)", color: "var(--steel-blue)" } : undefined}
            >
              {f === "all" ? "Todos" : f === "published" ? "Publicados" : f === "draft" ? "Borrador" : "Premium"}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "var(--text-muted)" }}>
          {filtered.length} post{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && <p className={styles.formError} style={{ marginBottom: 12 }}>{error}</p>}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {search || statusFilter !== "all" ? "No se encontraron resultados." : "No hay posts todavía."}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th className={styles.hideMobile}>Fecha</th>
                <th className={styles.hideMobile}>Slug</th>
                <th>Premium</th>
                <th>Publicado</th>
                <th>Editar</th>
                <th>Ver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className={styles.bold}>{post.title}</span>
                    {post.draft_updated_at && !post.published && (
                      <span
                        className={styles.tag}
                        style={{ marginLeft: 8, fontSize: 10 }}
                        title={`Borrador actualizado ${new Date(post.draft_updated_at).toLocaleString()}`}
                      >
                        borrador
                      </span>
                    )}
                  </td>
                  <td className={styles.hideMobile}>
                    <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11 }}>
                      {post.date}
                    </span>
                  </td>
                  <td className={styles.hideMobile}>
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
                      href={`/editor/${post.id}`}
                      className={styles.link}
                      title="Abrir editor"
                    >
                      ✎
                    </Link>
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
