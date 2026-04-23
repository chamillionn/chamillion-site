"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Analysis, AnalysisVisibility } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import ConfirmModal from "@/components/confirm-modal";
import { setAnalysisVisibility, deleteAnalysis } from "./actions";
import crud from "../crud.module.css";
import styles from "./analisis.module.css";

const VISIBILITIES: { value: AnalysisVisibility; label: string; hint: string }[] = [
  { value: "public", label: "Público", hint: "Visible en /analisis para todos" },
  { value: "premium", label: "Premium", hint: "Miembros del hub — paywall para anónimos" },
  { value: "hidden", label: "Oculto", hint: "Sólo admin lo ve" },
];

const FILTERS: { value: "all" | AnalysisVisibility; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "public", label: "Público" },
  { value: "premium", label: "Premium" },
  { value: "hidden", label: "Oculto" },
];

function visibilityPillClass(v: AnalysisVisibility) {
  if (v === "public") return styles.pillPublic;
  if (v === "premium") return styles.pillPremium;
  return styles.pillHidden;
}

export default function AnalysesTable({ analyses }: { analyses: Analysis[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | AnalysisVisibility>("all");
  const [confirmDelete, setConfirmDelete] = useState<Analysis | null>(null);

  const filtered = analyses.filter((a) => {
    if (filter !== "all" && a.visibility !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.asset?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  function handleVisibility(id: string, v: AnalysisVisibility) {
    startTransition(async () => {
      const res = await setAnalysisVisibility(id, v);
      if (res.error) toast(res.error, "error");
      else toast(`Visibilidad → ${v}`, "success");
    });
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    startTransition(async () => {
      const res = await deleteAnalysis(target.id);
      if (res.error) toast(res.error, "error");
      else toast("Análisis eliminado", "success");
    });
  }

  return (
    <div>
      <div className={crud.heading}>Análisis</div>

      <div className={crud.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, slug, activo..."
            className={crud.input}
            style={{ width: 240, padding: "6px 10px", fontSize: 12 }}
          />
          <div className={styles.filterGroup}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`${crud.btnSecondary} ${filter === f.value ? styles.filterActive : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <Link href="/admin/analisis/new" className={crud.btnPrimary}>
          + Nuevo análisis
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className={crud.empty}>
          {search || filter !== "all"
            ? "No se encontraron resultados."
            : "No hay análisis todavía. Crea el primero."}
        </div>
      ) : (
        <div className={crud.tableWrap}>
          <table className={crud.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Activo</th>
                <th>Tesis</th>
                <th>Visibilidad</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/analisis/${a.slug}`} className={styles.titleLink}>
                      {a.title}
                    </Link>
                    <div className={styles.slugMono}>{a.slug}</div>
                  </td>
                  <td>
                    {a.asset ? (
                      <span className={crud.tag}>{a.asset}</span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.thesisCell}>{a.thesis || <span className={styles.muted}>—</span>}</td>
                  <td>
                    <div className={styles.segmented} role="group" aria-label="Visibilidad">
                      {VISIBILITIES.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          title={v.hint}
                          disabled={pending}
                          onClick={() => handleVisibility(a.id, v.value)}
                          className={`${styles.segmentedItem} ${a.visibility === v.value ? `${styles.segmentedActive} ${visibilityPillClass(v.value)}` : ""}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className={styles.dateMono}>
                    {new Date(a.updated_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <div className={crud.actions}>
                      <Link
                        href={`/admin/analisis/${a.slug}`}
                        className={crud.actionBtn}
                        title="Editar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                      {a.visibility !== "hidden" && (
                        <Link
                          href={`/analisis/${a.slug}`}
                          target="_blank"
                          className={crud.actionBtn}
                          title="Ver"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M7 7h10v10" />
                          </svg>
                        </Link>
                      )}
                      <button
                        onClick={() => setConfirmDelete(a)}
                        className={`${crud.actionBtn} ${crud.actionBtnDanger}`}
                        title="Eliminar"
                        disabled={pending}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Eliminar análisis"
        message={
          confirmDelete
            ? `¿Eliminar "${confirmDelete.title}" permanentemente? Esta acción no se puede deshacer.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
