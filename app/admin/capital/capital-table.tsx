"use client";

import { useState } from "react";
import type { CapitalFlow, CapitalFlowType } from "@/lib/supabase/types";
import { createCapitalFlow, deleteCapitalFlow } from "./actions";
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
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCapitalFlow(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await deleteCapitalFlow(id);
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Importe</th>
                <th>Activo</th>
                <th>Cantidad</th>
                <th>Precio/u</th>
                <th>Exchange</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => (
                <tr key={f.id}>
                  <td>{fmtDate(f.date)}</td>
                  <td>
                    <span className={`${styles.tag} ${typeTag(f.type)}`}>
                      {TYPES.find((t) => t.value === f.type)?.label ?? f.type}
                    </span>
                  </td>
                  <td className={styles.bold}>{fmtEur(f.amount_eur)}</td>
                  <td>{f.asset || "—"}</td>
                  <td>{f.quantity != null ? f.quantity : "—"}</td>
                  <td>{f.price_per_unit != null ? `${f.price_per_unit} €` : "—"}</td>
                  <td>{f.exchange || "—"}</td>
                  <td>{f.notes || "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleDelete(f.id)}
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
      )}

      {creating && (
        <div className={styles.overlay} onClick={() => setCreating(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Nuevo registro</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Tipo</span>
                  <select name="type" defaultValue="buy" className={styles.input}>
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
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Importe (EUR)</span>
                  <input name="amount_eur" type="number" step="any" required className={styles.input} placeholder="500" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Activo</span>
                  <input name="asset" className={styles.input} placeholder="ETH, USDC..." />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Cantidad</span>
                  <input name="quantity" type="number" step="any" className={styles.input} placeholder="0.2" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Precio/unidad (EUR)</span>
                  <input name="price_per_unit" type="number" step="any" className={styles.input} placeholder="2500" />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Exchange</span>
                  <input name="exchange" className={styles.input} placeholder="Kraken" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Notas</span>
                  <input name="notes" className={styles.input} placeholder="Opcional..." />
                </label>
              </div>

              {error && <p className={styles.formError}>{error}</p>}

              <div className={styles.formActions}>
                <button type="button" onClick={() => setCreating(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={styles.btnPrimary}>
                  {loading ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
