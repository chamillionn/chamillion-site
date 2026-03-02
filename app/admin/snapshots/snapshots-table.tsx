"use client";

import { useState } from "react";
import type { Snapshot, SnapshotPosition } from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { deleteSnapshot, deleteSnapshots } from "./actions";
import { useRowSelection } from "../use-row-selection";
import ConfirmModal from "@/components/confirm-modal";
import SnapshotChart from "./snapshot-chart";
import styles from "../crud.module.css";

function fmtEur(n: number) {
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  snapshots: Snapshot[];
}

export default function SnapshotsTable({ snapshots }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { selected, count: selCount, isSelected, toggle, toggleAll, clear } = useRowSelection();

  async function doDelete(id: string) {
    setDeleteLoading(true);
    const res = await deleteSnapshot(id);
    setDeleteLoading(false);
    setConfirmDelete(null);
    if (res.error) toast(res.error, "error");
    else toast("Snapshot eliminado", "success");
  }

  async function doBulkDelete() {
    setConfirmDelete(null);
    setDeleteLoading(true);
    const res = await deleteSnapshots([...selected]);
    setDeleteLoading(false);
    if (res.error) toast(res.error, "error");
    else { toast(`${res.count} snapshots eliminados`, "success"); clear(); }
  }

  const filtered = dateFilter
    ? snapshots.filter((s) => s.snapshot_date.startsWith(dateFilter))
    : snapshots;

  const oldest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latest = snapshots.length > 0 ? snapshots[0] : null;

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Chart */}
      <SnapshotChart snapshots={snapshots} />

      {/* Summary tags */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className={styles.tag} style={{ padding: "8px 14px", fontSize: 13 }}>
          Total: <strong>{snapshots.length}</strong> snapshots
        </div>
        {oldest && (
          <div className={styles.tag} style={{ padding: "8px 14px", fontSize: 13 }}>
            Desde: <strong>{fmtDate(oldest.snapshot_date)}</strong>
          </div>
        )}
        {latest && (
          <div className={`${styles.tag} ${styles.tagActive}`} style={{ padding: "8px 14px", fontSize: 13 }}>
            Último: <strong>{fmtEur(latest.total_value)}</strong>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); clear(); }}
            className={styles.input}
            style={{ width: 160, padding: "6px 10px", fontSize: 12 }}
          />
          {dateFilter && (
            <button onClick={() => { setDateFilter(""); clear(); }} className={styles.btnSecondary}>
              Todos
            </button>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "var(--text-muted)" }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No hay snapshots{dateFilter ? ` para ${dateFilter}` : ""}.</div>
      ) : (
        <>
        {selCount > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selCount} seleccionado{selCount !== 1 ? "s" : ""}</span>
            <button onClick={() => setConfirmDelete("bulk")} disabled={deleteLoading} className={`${styles.btnSecondary} ${styles.bulkBtnDanger}`}>
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
                    checked={selCount === filtered.length && selCount > 0}
                    onChange={() => toggleAll(filtered.map((s) => s.id))}
                  />
                </th>
                <th></th>
                <th>Fecha</th>
                <th>Valor</th>
                <th className={styles.hideMobile}>Coste</th>
                <th>PnL</th>
                <th className={styles.hideMobile}>Posiciones</th>
                <th className={styles.hideMobile}>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const pnl = s.total_value - s.total_cost;
                const posCount = s.positions_data?.length ?? 0;
                const isExpanded = expanded.has(s.id);

                return (
                  <SnapshotRow
                    key={s.id}
                    snapshot={s}
                    pnl={pnl}
                    posCount={posCount}
                    isExpanded={isExpanded}
                    isChecked={isSelected(s.id)}
                    onCheck={() => toggle(s.id)}
                    onToggle={() => toggleRow(s.id)}
                    onRequestDelete={(id) => setConfirmDelete(id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={confirmDelete === "bulk" ? `Eliminar ${selCount} snapshots` : "Eliminar snapshot"}
        message={confirmDelete === "bulk"
          ? `¿Eliminar ${selCount} snapshots permanentemente? Esta acción no se puede deshacer.`
          : "¿Eliminar este snapshot? Esta acción no se puede deshacer."}
        onConfirm={() => {
          if (confirmDelete === "bulk") doBulkDelete();
          else if (confirmDelete) doDelete(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

function SnapshotRow({
  snapshot: s,
  pnl,
  posCount,
  isExpanded,
  isChecked,
  onCheck,
  onToggle,
  onRequestDelete,
}: {
  snapshot: Snapshot;
  pnl: number;
  posCount: number;
  isExpanded: boolean;
  isChecked: boolean;
  onCheck: () => void;
  onToggle: () => void;
  onRequestDelete: (id: string) => void;
}) {

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: posCount > 0 ? "pointer" : "default" }}
      >
        <td className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={isChecked}
            onChange={onCheck}
          />
        </td>
        <td style={{ width: 28, textAlign: "center" }}>
          {posCount > 0 && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: "transform 0.2s ease",
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              <path d="M6 4L10 8L6 12" />
            </svg>
          )}
        </td>
        <td>{fmtDateTime(s.snapshot_date)}</td>
        <td className={styles.bold}>{fmtEur(s.total_value)}</td>
        <td className={styles.hideMobile}>{fmtEur(s.total_cost)}</td>
        <td>
          <span className={`${styles.tag} ${pnl >= 0 ? styles.tagActive : styles.tagClosed}`}>
            {pnl >= 0 ? "+" : ""}{fmtEur(pnl)}
          </span>
        </td>
        <td className={styles.hideMobile}>{posCount}</td>
        <td className={styles.hideMobile} style={{ color: "var(--text-muted)", fontSize: 12 }}>{s.notes || "—"}</td>
        <td>
          <button
            onClick={(e) => { e.stopPropagation(); onRequestDelete(s.id); }}
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            title="Eliminar snapshot"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </td>
      </tr>

      {isExpanded && s.positions_data && s.positions_data.length > 0 && (
        <tr>
          <td colSpan={9} style={{ padding: 0 }}>
            <PositionsSubTable positions={s.positions_data} />
          </td>
        </tr>
      )}
    </>
  );
}

function PositionsSubTable({ positions }: { positions: SnapshotPosition[] }) {
  return (
    <div
      style={{
        margin: "0 14px 10px 28px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <table className={styles.table} style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Plataforma</th>
            <th>Estrategia</th>
            <th>Size</th>
            <th>Coste</th>
            <th>Valor</th>
            <th>PnL</th>
            <th>ROI</th>
            <th>Alloc</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => (
            <tr key={i}>
              <td className={styles.bold}>{p.asset}</td>
              <td>{p.platform || "—"}</td>
              <td>{p.strategy || "—"}</td>
              <td>{p.size.toLocaleString("es-ES", { maximumFractionDigits: 6 })}</td>
              <td>{fmtEur(p.cost_basis)}</td>
              <td className={styles.bold}>{fmtEur(p.current_value)}</td>
              <td>
                <span className={`${styles.tag} ${p.pnl >= 0 ? styles.tagActive : styles.tagClosed}`}>
                  {p.pnl >= 0 ? "+" : ""}{fmtEur(p.pnl)}
                </span>
              </td>
              <td style={{ color: p.roi_pct >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmtPct(p.roi_pct)}
              </td>
              <td>{p.allocation_pct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
