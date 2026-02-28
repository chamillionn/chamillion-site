"use client";

import { useState } from "react";
import type { Strategy } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { createStrategy, updateStrategy, deleteStrategy } from "./actions";
import styles from "../crud.module.css";

const STATUSES = ["active", "paused", "closed"];

function statusClass(status: string) {
  if (status === "active") return styles.tagActive;
  if (status === "paused") return styles.tagPaused;
  if (status === "closed") return styles.tagClosed;
  return styles.tag;
}

export default function StrategiesTable({ strategies }: { strategies: Strategy[] }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = editing
      ? await updateStrategy(editing.id, formData)
      : await createStrategy(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    toast(editing ? "Estrategia actualizada" : "Estrategia creada", "success");
    setCreating(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta estrategia?")) return;
    const res = await deleteStrategy(id);
    if (res.error) toast(res.error, "error");
    else toast("Estrategia eliminada", "success");
  }

  const showForm = creating || editing;

  return (
    <div>
      <div className={styles.toolbar}>
        <span />
        <button onClick={() => setCreating(true)} className={styles.btnPrimary}>
          + Nueva estrategia
        </button>
      </div>

      {strategies.length === 0 ? (
        <div className={styles.empty}>No hay estrategias registradas.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr key={s.id}>
                  <td className={styles.bold}>{s.name}</td>
                  <td><span className={`${styles.tag} ${statusClass(s.status)}`}>{s.status}</span></td>
                  <td>{s.description || "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => setEditing(s)} className={styles.actionBtn} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(s.id)} className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Eliminar">
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

      {showForm && (
        <div className={styles.overlay} onClick={() => { setCreating(false); setEditing(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editing ? "Editar estrategia" : "Nueva estrategia"}
            </h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Nombre</span>
                  <input name="name" defaultValue={editing?.name ?? ""} required className={styles.input} placeholder="LP Stablecoins" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Estado</span>
                  <select name="status" defaultValue={editing?.status ?? "active"} className={styles.input}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Descripción</span>
                <textarea name="description" defaultValue={editing?.description ?? ""} className={styles.input} rows={3} placeholder="Descripción opcional..." />
              </label>

              {error && <p className={styles.formError}>{error}</p>}

              <div className={styles.formActions}>
                <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={styles.btnPrimary}>
                  {loading ? "Guardando..." : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
