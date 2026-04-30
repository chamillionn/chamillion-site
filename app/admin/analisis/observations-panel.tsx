"use client";

import { useState, useTransition } from "react";
import type {
  Analysis,
  AnalysisObservation,
  ObservationSource,
} from "@/lib/supabase/types";
import { useToast } from "@/components/admin-toast";
import {
  addObservation,
  deleteObservation,
  pullBinanceObservation,
  importKmaCsv,
} from "./actions";
import crud from "../crud.module.css";
import styles from "./analisis.module.css";

function formatDt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayInputValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function ObservationsPanel({
  analysis,
  observations,
}: {
  analysis: Analysis;
  observations: AnalysisObservation[];
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [observedAt, setObservedAt] = useState(todayInputValue());
  const [value, setValue] = useState("");
  const [source, setSource] = useState<ObservationSource>("manual");
  const [note, setNote] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState("");

  const canAutoPull = analysis.prediction_source === "binance" && !!analysis.prediction_asset;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addObservation(analysis.id, fd);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      toast("Observación añadida", "success");
      setValue("");
      setNote("");
      setObservedAt(todayInputValue());
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteObservation(id);
      if (res.error) toast(res.error, "error");
      else toast("Observación eliminada", "success");
    });
  }

  function handlePull() {
    startTransition(async () => {
      const res = await pullBinanceObservation(analysis.id);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      toast(res.skipped ? "Ya existe una observación de hoy" : "Pull Binance OK", "success");
    });
  }

  function handleCsvImport() {
    if (!csvText.trim()) {
      toast("Pega el contenido del CSV primero", "error");
      return;
    }
    startTransition(async () => {
      const res = await importKmaCsv(analysis.id, csvText);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      const msg = `CSV importado · +${res.inserted} nuevos · ${res.updated} actualizados`;
      toast(msg, "success");
      if (res.parseErrors && res.parseErrors.length > 0) {
        console.warn("CSV parse errors:", res.parseErrors);
      }
      setCsvText("");
      setShowCsvImport(false);
    });
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file, "utf-8");
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}>
        Observaciones
        <span className={styles.sectionHint}>
          {observations.length} registro{observations.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowCsvImport((v) => !v)}
          className={crud.btnSecondary}
          style={{ marginLeft: "auto" }}
        >
          {showCsvImport ? "Cancelar CSV" : "Importar CSV KMA"}
        </button>
      </div>

      {showCsvImport && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Pega el CSV de KMA o selecciona el archivo. Columnas reconocidas:{" "}
            <code style={{ background: "rgba(var(--steel-blue-rgb),0.08)", padding: "0 4px" }}>일시</code>{" "}
            +{" "}
            <code style={{ background: "rgba(var(--steel-blue-rgb),0.08)", padding: "0 4px" }}>일강수량(mm)</code>
            {" "}· Formato simple: fecha,mm (sin cabecera).
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvFile}
              className={crud.input}
              style={{ flex: 1 }}
            />
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"일시,일강수량(mm)\n2026-04-01,2.5\n2026-04-02,0.0\n..."}
            className={styles.mdTextarea}
            style={{ minHeight: 140, marginBottom: 8 }}
          />
          <button
            type="button"
            onClick={handleCsvImport}
            disabled={pending || !csvText.trim()}
            className={crud.btnPrimary}
          >
            {pending ? "Importando..." : "Importar"}
          </button>
        </div>
      )}

      {!analysis.has_prediction ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Añade una predicción para empezar a registrar observaciones.
        </p>
      ) : (
        <>
          <form onSubmit={handleAdd} className={crud.form} style={{ marginBottom: 18 }}>
            <div className={styles.formGrid}>
              <label className={crud.field}>
                <span className={crud.fieldLabel}>Fecha</span>
                <input
                  type="datetime-local"
                  name="observed_at"
                  value={observedAt}
                  onChange={(e) => setObservedAt(e.target.value)}
                  required
                  className={crud.input}
                />
              </label>
              <label className={crud.field}>
                <span className={crud.fieldLabel}>
                  Valor {analysis.prediction_unit ? `(${analysis.prediction_unit})` : ""}
                </span>
                <input
                  type="number"
                  step="any"
                  name="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className={crud.input}
                  placeholder="4.35"
                />
              </label>
              <label className={crud.field}>
                <span className={crud.fieldLabel}>Fuente</span>
                <select
                  name="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as ObservationSource)}
                  className={crud.input}
                >
                  <option value="manual">Manual</option>
                  <option value="binance">Binance</option>
                  <option value="twelvedata">Twelvedata</option>
                </select>
              </label>
              <label className={crud.field} style={{ gridColumn: "1 / -1" }}>
                <span className={crud.fieldLabel}>Nota (opcional)</span>
                <input
                  type="text"
                  name="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={crud.input}
                  placeholder="Cierre de sesión, comentario sobre el movimiento..."
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
              <button type="submit" disabled={pending} className={crud.btnPrimary}>
                {pending ? "Guardando..." : "+ Añadir"}
              </button>
              {canAutoPull && (
                <button
                  type="button"
                  onClick={handlePull}
                  disabled={pending}
                  className={crud.btnSecondary}
                  title={`Pull cierre diario de ${analysis.prediction_asset}`}
                >
                  {pending ? "..." : `Pull ${analysis.prediction_asset} ahora`}
                </button>
              )}
            </div>
          </form>

          {observations.length === 0 ? (
            <div className={crud.empty}>Sin observaciones todavía.</div>
          ) : (
            <div className={crud.tableWrap}>
              <table className={crud.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Valor</th>
                    <th>Fuente</th>
                    <th>Nota</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((o) => (
                    <tr key={o.id}>
                      <td className={styles.dateMono}>{formatDt(o.observed_at)}</td>
                      <td className={crud.bold}>
                        {o.value} {analysis.prediction_unit || ""}
                      </td>
                      <td>
                        <span className={crud.tag}>{o.source || "—"}</span>
                      </td>
                      <td>{o.note || <span className={styles.muted}>—</span>}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDelete(o.id)}
                          disabled={pending}
                          className={`${crud.actionBtn} ${crud.actionBtnDanger}`}
                          title="Eliminar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
