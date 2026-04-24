"use client";

import { useTransition } from "react";
import type {
  Analysis,
  AnalysisSnapshot,
  AnalysisEvent,
} from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import { runTrackerTick } from "./actions";
import crud from "../crud.module.css";
import styles from "./analisis.module.css";

interface Props {
  analysis: Analysis;
  latest: AnalysisSnapshot | null;
  events: AnalysisEvent[];
}

function formatUsd(n: number) {
  const sign = n < 0 ? "−" : "+";
  return `${sign}$${Math.abs(n).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
}

function formatCents(p: number) {
  return `${(p * 100).toFixed(0)}¢`;
}

export default function TrackerPanel({ analysis, latest, events }: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const handleTick = () => {
    startTransition(async () => {
      const res = await runTrackerTick(analysis.id);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      const summary = `Tick OK · ${res.positionLegs ?? 0} posiciones · ${res.eventsFetched ?? 0} eventos vistos · ${res.eventsInserted ?? 0} nuevos`;
      toast(summary, "success");
      // Surface warnings to console + a separate toast so we see them
      if (res.warnings && res.warnings.length > 0) {
        console.warn("Tracker warnings:", res.warnings);
        toast(`⚠ ${res.warnings[0]}`, "error");
      }
    });
  };

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}>
        Tracker
        <span className={styles.sectionHint}>
          {latest
            ? `Último snapshot · ${new Date(latest.snapshot_date).toLocaleDateString("es-ES")}`
            : "Sin snapshots todavía"}
        </span>
        <button
          type="button"
          onClick={handleTick}
          disabled={pending}
          className={crud.btnPrimary}
          style={{ marginLeft: "auto" }}
        >
          {pending ? "Ejecutando..." : "Ejecutar tick ahora"}
        </button>
      </div>

      {analysis.resolved_at && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "color-mix(in oklch, var(--green, #5baa7c) 10%, transparent)",
            border: "1px solid color-mix(in oklch, var(--green, #5baa7c) 30%, transparent)",
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          <strong>Resuelto · {analysis.final_outcome}</strong>
          {analysis.final_roi_pct != null && (
            <>
              {" · ROI "}
              {analysis.final_roi_pct.toFixed(1)}%
            </>
          )}
          {" · "}
          {new Date(analysis.resolved_at).toLocaleDateString("es-ES")}
        </div>
      )}

      {latest && (
        <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {latest.underlying && (
            <div>
              <div className={crud.fieldLabel}>Subyacente</div>
              <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 15, fontWeight: 600 }}>
                {latest.underlying.value} {latest.underlying.unit}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-dm-mono), monospace" }}>
                {latest.underlying.source}
              </div>
            </div>
          )}
          {latest.position && (
            <div>
              <div className={crud.fieldLabel}>PnL</div>
              <div
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 15,
                  fontWeight: 600,
                  color: latest.position.totalCashPnl >= 0 ? "var(--green, #5baa7c)" : "var(--red, #c7555a)",
                }}
              >
                {formatUsd(latest.position.totalCashPnl)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-dm-mono), monospace" }}>
                {latest.position.legs.length} leg{latest.position.legs.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
          {latest.edge && (
            <div>
              <div className={crud.fieldLabel}>Edge</div>
              <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 15, fontWeight: 600 }}>
                {formatUsd(latest.edge.evAbs)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-dm-mono), monospace" }}>
                mkt {(latest.edge.mktProb * 100).toFixed(0)}% · mío {(latest.edge.myProb * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      )}

      {latest?.position?.legs && latest.position.legs.length > 0 && (
        <div className={crud.tableWrap} style={{ marginTop: 14 }}>
          <table className={crud.table}>
            <thead>
              <tr>
                <th>Mercado</th>
                <th>Side</th>
                <th>Size</th>
                <th>Avg</th>
                <th>Actual</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {latest.position.legs.map((leg, i) => (
                <tr key={i}>
                  <td className={crud.bold} style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {leg.name}
                  </td>
                  <td>
                    <span className={crud.tag}>{leg.side}</span>
                  </td>
                  <td>{leg.size.toLocaleString("es-ES")}</td>
                  <td>{formatCents(leg.avgPrice)}</td>
                  <td>{formatCents(leg.curPrice)}</td>
                  <td style={{ color: leg.cashPnl >= 0 ? "var(--green, #5baa7c)" : "var(--red, #c7555a)", fontWeight: 600 }}>
                    {formatUsd(leg.cashPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {events.length > 0 && (
        <>
          <h3 className={styles.sectionTitle} style={{ marginTop: 20 }}>
            Eventos recientes
            <span className={styles.sectionHint}>{events.length}</span>
          </h3>
          <div className={crud.tableWrap}>
            <table className={crud.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Origen</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 20).map((ev) => (
                  <tr key={ev.id}>
                    <td className={styles.dateMono}>
                      {new Date(ev.occurred_at).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td><span className={crud.tag}>{ev.type}</span></td>
                    <td>{ev.source ?? "—"}</td>
                    <td style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.payload ? JSON.stringify(ev.payload).slice(0, 120) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
