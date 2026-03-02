"use client";

import { useState } from "react";
import type { Platform, Strategy, Position } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { closePosition, closePositions, reopenPosition, deletePosition, deletePositions } from "./actions";
import PositionForm from "./form";
import ConfirmModal from "@/components/confirm-modal";
import { useRowSelection } from "../use-row-selection";
import styles from "./page.module.css";
import crudStyles from "../crud.module.css";

type PositionRow = Position & {
  platforms: { name: string } | null;
  strategies: { name: string } | null;
};

interface Props {
  positions: PositionRow[];
  platforms: Platform[];
  strategies: Strategy[];
}

export default function PositionsTable({ positions, platforms, strategies }: Props) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"active" | "closed" | "all">("active");
  const [editing, setEditing] = useState<PositionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { selected, count: selCount, isSelected, toggle, toggleAll, clear } = useRowSelection();

  const filtered = positions.filter((p) => {
    if (filter === "active") return p.is_active;
    if (filter === "closed") return !p.is_active;
    return true;
  });

  async function handleClose(id: string) {
    setActionLoading(id);
    const res = await closePosition(id);
    setActionLoading(null);
    if (res.error) toast(res.error, "error");
    else toast("Posicion cerrada", "success");
  }

  async function handleReopen(id: string) {
    setActionLoading(id);
    const res = await reopenPosition(id);
    setActionLoading(null);
    if (res.error) toast(res.error, "error");
    else toast("Posicion reabierta", "success");
  }

  async function doDelete(id: string) {
    setConfirmDelete(null);
    setActionLoading(id);
    const res = await deletePosition(id);
    setActionLoading(null);
    if (res.error) toast(res.error, "error");
    else toast("Posicion eliminada", "success");
  }

  async function doBulkDelete() {
    setConfirmDelete(null);
    const ids = [...selected];
    setActionLoading("bulk");
    const res = await deletePositions(ids);
    setActionLoading(null);
    if (res.error) toast(res.error, "error");
    else { toast(`${res.count} posiciones eliminadas`, "success"); clear(); }
  }

  async function handleBulkClose() {
    const ids = [...selected];
    setActionLoading("bulk");
    const res = await closePositions(ids);
    setActionLoading(null);
    if (res.error) toast(res.error, "error");
    else { toast(`${res.count} posiciones cerradas`, "success"); clear(); }
  }

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {(["active", "closed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); clear(); }}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
            >
              {f === "active" ? "Activas" : f === "closed" ? "Cerradas" : "Todas"}
            </button>
          ))}
        </div>
        <button onClick={() => setCreating(true)} className={styles.btnPrimary}>
          + Nueva posición
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          No hay posiciones {filter === "active" ? "activas" : filter === "closed" ? "cerradas" : ""}.
        </div>
      ) : (
        <>
        {selCount > 0 && (
          <div className={crudStyles.bulkBar}>
            <span className={crudStyles.bulkCount}>{selCount} seleccionado{selCount !== 1 ? "s" : ""}</span>
            {filter === "active" && (
              <button onClick={handleBulkClose} disabled={actionLoading === "bulk"} className={crudStyles.btnSecondary}>
                Cerrar
              </button>
            )}
            <button onClick={() => setConfirmDelete("bulk")} disabled={actionLoading === "bulk"} className={`${crudStyles.btnSecondary} ${crudStyles.bulkBtnDanger}`}>
              Eliminar
            </button>
            <button onClick={clear} className={crudStyles.btnSecondary}>Deseleccionar</button>
          </div>
        )}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={crudStyles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={crudStyles.checkbox}
                    checked={selCount === filtered.length && selCount > 0}
                    onChange={() => toggleAll(filtered.map((p) => p.id))}
                  />
                </th>
                <th>Asset</th>
                <th>Plataforma</th>
                <th className={styles.hideMobile}>Estrategia</th>
                <th className={`${styles.right} ${styles.hideMobile}`}>Size</th>
                <th className={`${styles.right} ${styles.hideMobile}`}>Coste</th>
                <th className={styles.right}>Valor</th>
                <th className={styles.right}>PnL</th>
                <th className={styles.right}>ROI</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const pnl = p.current_value - p.cost_basis;
                const roi = p.cost_basis > 0 ? (pnl / p.cost_basis) * 100 : 0;
                return (
                  <tr key={p.id} className={!p.is_active ? styles.rowClosed : undefined}>
                    <td className={crudStyles.checkboxCell}>
                      <input
                        type="checkbox"
                        className={crudStyles.checkbox}
                        checked={isSelected(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                    </td>
                    <td className={styles.bold}>{p.asset}</td>
                    <td>{p.platforms?.name || "—"}</td>
                    <td className={styles.hideMobile}>{p.strategies?.name || "—"}</td>
                    <td className={`${styles.right} ${styles.hideMobile}`}>{p.size}</td>
                    <td className={`${styles.right} ${styles.hideMobile}`}>{fmt(p.cost_basis)}</td>
                    <td className={styles.right}>{fmt(p.current_value)}</td>
                    <td
                      className={styles.right}
                      style={{ color: pnl >= 0 ? "var(--green)" : "var(--red)" }}
                    >
                      {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                    </td>
                    <td
                      className={styles.right}
                      style={{ color: roi >= 0 ? "var(--green)" : "var(--red)" }}
                    >
                      {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => setEditing(p)}
                          className={styles.actionBtn}
                          title="Editar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {p.is_active ? (
                          <button
                            onClick={() => handleClose(p.id)}
                            disabled={actionLoading === p.id}
                            className={styles.actionBtn}
                            title="Cerrar posición"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(p.id)}
                            disabled={actionLoading === p.id}
                            className={styles.actionBtn}
                            title="Reabrir posición"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 4v6h6M23 20v-6h-6" />
                              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          disabled={actionLoading === p.id}
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
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={confirmDelete === "bulk" ? `Eliminar ${selCount} posiciones` : "Eliminar posición"}
        message={confirmDelete === "bulk"
          ? `¿Eliminar ${selCount} posiciones permanentemente? Esta acción no se puede deshacer.`
          : "¿Eliminar esta posición permanentemente? Esta acción no se puede deshacer."}
        onConfirm={() => {
          if (confirmDelete === "bulk") doBulkDelete();
          else if (confirmDelete) doDelete(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {(creating || editing) && (
        <PositionForm
          platforms={platforms}
          strategies={strategies}
          position={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
