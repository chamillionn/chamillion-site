"use client";

import { useState, useEffect } from "react";
import type { CapitalFlow, CapitalFlowType } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { createCapitalFlow, updateCapitalFlow, deleteCapitalFlow, deleteCapitalFlows } from "./actions";
import { useRowSelection } from "../use-row-selection";
import ConfirmModal from "@/components/confirm-modal";
import styles from "../crud.module.css";

const TYPES: { value: CapitalFlowType; label: string }[] = [
  { value: "buy", label: "Compra" },
  { value: "sell", label: "Venta" },
  { value: "deposit_fiat", label: "Deposito fiat" },
  { value: "withdraw_fiat", label: "Retiro fiat" },
];

function typeTag(type: string) {
  if (type === "buy" || type === "deposit_fiat") return styles.tagActive;
  return styles.tagClosed;
}

function fmtEur(n: number) {
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  flows: CapitalFlow[];
  costBasis: { invested: number; withdrawn: number; net: number };
}

export default function CapitalTable({ flows, costBasis }: Props) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CapitalFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { selected, count: selCount, isSelected, toggle, toggleAll, clear } = useRowSelection();

  const showForm = creating || editing;

  useEffect(() => {
    if (!showForm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setCreating(false); setEditing(null); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showForm]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = editing
      ? await updateCapitalFlow(editing.id, formData)
      : await createCapitalFlow(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    toast(editing ? "Registro actualizado" : "Registro creado", "success");
    setCreating(false);
    setEditing(null);
  }

  async function doDelete(id: string) {
    setConfirmDelete(null);
    const res = await deleteCapitalFlow(id);
    if (res.error) toast(res.error, "error");
    else toast("Registro eliminado", "success");
  }

  async function doBulkDelete() {
    setConfirmDelete(null);
    const res = await deleteCapitalFlows([...selected]);
    if (res.error) toast(res.error, "error");
    else { toast(`${res.count} registros eliminados`, "success"); clear(); }
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className={styles.tag} style={{ padding: "8px 14px", fontSize: 13 }}>
          Invertido: <strong>{fmtEur(costBasis.invested)}</strong>
        </div>
        {costBasis.withdrawn > 0 && (
          <div className={`${styles.tag} ${styles.tagClosed}`} style={{ padding: "8px 14px", fontSize: 13 }}>
            Retirado: <strong>{fmtEur(costBasis.withdrawn)}</strong>
          </div>
        )}
        <div className={`${styles.tag} ${styles.tagActive}`} style={{ padding: "8px 14px", fontSize: 13 }}>
          Neto: <strong>{fmtEur(costBasis.net)}</strong>
        </div>
      </div>

      <div className={styles.toolbar}>
        <span />
        <button onClick={() => setCreating(true)} className={styles.btnPrimary}>
          + Nuevo registro
        </button>
      </div>

      {flows.length === 0 ? (
        <div className={styles.empty}>No hay registros de capital.</div>
      ) : (
        <>
        {selCount > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selCount} seleccionado{selCount !== 1 ? "s" : ""}</span>
            <button onClick={() => setConfirmDelete("bulk")} className={`${styles.btnSecondary} ${styles.bulkBtnDanger}`}>
              Eliminar
            </button>
            <button onClick={clear} className={styles.btnSecondary}>Deseleccionar</button>
          </div>
        )}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selCount === flows.length && selCount > 0}
                    onChange={() => toggleAll(flows.map((f) => f.id))}
                  />
                </th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Importe</th>
                <th>Activo</th>
                <th className={styles.hideMobile}>Cantidad</th>
                <th className={styles.hideMobile}>Precio/u</th>
                <th className={styles.hideMobile}>Exchange</th>
                <th className={styles.hideMobile}>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => (
                <tr key={f.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isSelected(f.id)}
                      onChange={() => toggle(f.id)}
                    />
                  </td>
                  <td>{fmtDate(f.date)}</td>
                  <td>
                    <span className={`${styles.tag} ${typeTag(f.type)}`}>
                      {TYPES.find((t) => t.value === f.type)?.label ?? f.type}
                    </span>
                  </td>
                  <td className={styles.bold}>{fmtEur(f.amount_eur)}</td>
                  <td>{f.asset || "—"}</td>
                  <td className={styles.hideMobile}>{f.quantity != null ? f.quantity : "—"}</td>
                  <td className={styles.hideMobile}>{f.price_per_unit != null ? `${f.price_per_unit} €` : "—"}</td>
                  <td className={styles.hideMobile}>{f.exchange || "—"}</td>
                  <td className={styles.hideMobile}>{f.notes || "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => setEditing(f)}
                        className={styles.actionBtn}
                        title="Editar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(f.id)}
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        title="Eliminar"
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
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={confirmDelete === "bulk" ? `Eliminar ${selCount} registros` : "Eliminar registro"}
        message={confirmDelete === "bulk"
          ? `¿Eliminar ${selCount} registros de capital permanentemente? Esta acción no se puede deshacer.`
          : "¿Eliminar este registro de capital? Esta acción no se puede deshacer."}
        onConfirm={() => {
          if (confirmDelete === "bulk") doBulkDelete();
          else if (confirmDelete) doDelete(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {showForm && (
        <div className={styles.overlay} onClick={() => { setCreating(false); setEditing(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editing ? "Editar registro" : "Nuevo registro"}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Tipo</span>
                  <select name="type" defaultValue={editing?.type ?? "buy"} className={styles.input}>
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Fecha</span>
                  <input
                    name="date"
                    type="date"
                    defaultValue={editing?.date?.split("T")[0] ?? new Date().toISOString().split("T")[0]}
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Importe (EUR)</span>
                  <input name="amount_eur" type="number" step="any" required defaultValue={editing?.amount_eur ?? ""} className={styles.input} placeholder="500" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Activo</span>
                  <input name="asset" defaultValue={editing?.asset ?? ""} className={styles.input} placeholder="ETH, USDC..." />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Cantidad</span>
                  <input name="quantity" type="number" step="any" defaultValue={editing?.quantity ?? ""} className={styles.input} placeholder="0.2" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Precio/unidad (EUR)</span>
                  <input name="price_per_unit" type="number" step="any" defaultValue={editing?.price_per_unit ?? ""} className={styles.input} placeholder="2500" />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Exchange</span>
                  <input name="exchange" defaultValue={editing?.exchange ?? ""} className={styles.input} placeholder="Kraken" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Notas</span>
                  <input name="notes" defaultValue={editing?.notes ?? ""} className={styles.input} placeholder="Opcional..." />
                </label>
              </div>

              {error && <p className={styles.formError}>{error}</p>}

              <div className={styles.formActions}>
                <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={styles.btnPrimary}>
                  {loading ? "Guardando..." : editing ? "Guardar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
