"use client";

import { useState } from "react";
import type { Snapshot, SnapshotPosition } from "@/lib/supabase/types";
import { deleteSnapshot } from "./actions";
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
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.input}
            style={{ width: 160, padding: "6px 10px", fontSize: 12 }}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className={styles.btnSecondary}>
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Fecha</th>
                <th>Valor</th>
                <th>Coste</th>
                <th>PnL</th>
                <th>Posiciones</th>
                <th>Notas</th>
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
                    onToggle={() => toggleRow(s.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SnapshotRow({
  snapshot: s,
  pnl,
  posCount,
  isExpanded,
  onToggle,
}: {
  snapshot: Snapshot;
  pnl: number;
  posCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("¿Eliminar este snapshot?")) return;
    setDeleting(true);
    await deleteSnapshot(s.id);
  }

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: posCount > 0 ? "pointer" : "default" }}
      >
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
        <td>{fmtEur(s.total_cost)}</td>
        <td>
          <span className={`${styles.tag} ${pnl >= 0 ? styles.tagActive : styles.tagClosed}`}>
            {pnl >= 0 ? "+" : ""}{fmtEur(pnl)}
          </span>
        </td>
        <td>{posCount}</td>
        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{s.notes || "—"}</td>
        <td>
          <button
            onClick={handleDelete}
            disabled={deleting}
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
          <td colSpan={8} style={{ padding: 0 }}>
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
