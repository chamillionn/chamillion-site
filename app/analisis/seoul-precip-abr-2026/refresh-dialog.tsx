"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  refreshStepPositions,
  refreshStepForecasts,
  refreshStepKma,
  refreshStepSave,
} from "./actions";
import styles from "./refresh-dialog.module.css";

interface LogLine {
  time: string;
  step: string;
  msg: string;
  status: "running" | "ok" | "err" | "warn" | "info";
}

function nowTime() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function RefreshDialog() {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);
  const [running, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const addLine = useCallback((step: string, msg: string, status: LogLine["status"]) => {
    setLog((prev) => {
      const next = [...prev, { time: nowTime(), step, msg, status }];
      // scroll terminal to bottom on next paint
      requestAnimationFrame(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      });
      return next;
    });
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file, "utf-8");
  }

  function handleOpen() {
    setOpen(true);
    setLog([]);
    setDone(false);
    setCsvText("");
  }

  function handleClose() {
    if (running) return;
    setOpen(false);
  }

  function handleStart() {
    setLog([]);
    setDone(false);
    startTransition(async () => {
      // ── Step 1: Polymarket positions ────────────────────────────────
      addLine("Polymarket", "Conectando…", "running");
      const posResult = await refreshStepPositions();
      if (posResult.ok) {
        addLine("Polymarket", posResult.summary, "ok");
        posResult.warnings.forEach((w) => addLine("Polymarket", w, "warn"));
      } else {
        addLine("Polymarket", posResult.summary, "err");
      }

      // ── Step 2: Open-Meteo forecasts ────────────────────────────────
      addLine("Open-Meteo", "Descargando modelos GFS/GEM/JMA/ECMWF + ensemble…", "running");
      const fcResult = await refreshStepForecasts();
      if (fcResult.ok) {
        addLine("Open-Meteo", fcResult.summary, "ok");
      } else {
        addLine("Open-Meteo", fcResult.summary, "err");
      }

      // ── Step 3: KMA CSV (optional) ──────────────────────────────────
      let latestKmaMm: number | null = null;
      let latestKmaDate: string | null = null;
      if (csvText.trim()) {
        addLine("KMA CSV", "Procesando…", "running");
        const kmaResult = await refreshStepKma(csvText);
        if (kmaResult.ok) {
          addLine("KMA CSV", kmaResult.summary, "ok");
          latestKmaMm = kmaResult.latestMm;
          latestKmaDate = kmaResult.latestDate;
        } else {
          addLine("KMA CSV", kmaResult.summary, "err");
        }
      } else {
        addLine("KMA CSV", "Sin CSV — usando última observación en DB", "info");
      }

      // ── Step 4: Save snapshot ───────────────────────────────────────
      addLine("Snapshot", "Guardando…", "running");
      const saveResult = await refreshStepSave({
        position: posResult.ok ? posResult.position : null,
        forecasts: fcResult.ok ? fcResult.forecasts : null,
        latestKmaMm,
        latestKmaDate,
      });
      if (saveResult.ok) {
        addLine("Snapshot", saveResult.summary, "ok");
      } else {
        addLine("Snapshot", saveResult.summary, "err");
      }

      setDone(true);
      router.refresh();
    });
  }

  const statusIcon: Record<LogLine["status"], string> = {
    running: "›",
    ok: "✓",
    err: "✗",
    warn: "⚠",
    info: "·",
  };

  const statusClass: Record<LogLine["status"], string> = {
    running: styles.logInfo,
    ok: styles.logOk,
    err: styles.logErr,
    warn: styles.logWarn,
    info: styles.logInfo,
  };

  return (
    <>
      <button className={styles.trigger} onClick={handleOpen} title="Actualizar datos del análisis">
        <RefreshIcon spinning={false} />
        Refresh
      </button>

      {open && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Refresh datos del análisis">
            <div className={styles.dialogHead}>
              <span className={styles.dialogTitle}>Refresh · Seoul Precip Abr 2026</span>
              <button className={styles.closeBtn} onClick={handleClose} disabled={running} aria-label="Cerrar">×</button>
            </div>

            <div className={styles.body}>
              {/* KMA CSV input */}
              <div className={styles.csvBlock}>
                <span className={styles.csvLabel}>KMA CSV — opcional</span>
                <span className={styles.csvHint}>
                  Columnas: 일시 + 일강수량(mm) · o simple YYYY-MM-DD,mm · sin CSV usa la última observación en DB
                </span>
                <div className={styles.csvInputRow}>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFile}
                    className={styles.fileInput}
                    disabled={running}
                  />
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"일시,일강수량(mm)\n2026-04-24,0.0\n2026-04-25,3.2\n..."}
                  className={styles.csvTextarea}
                  disabled={running}
                  spellCheck={false}
                />
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  className={styles.btnStart}
                  onClick={handleStart}
                  disabled={running}
                >
                  {running ? (
                    <>
                      <RefreshIcon spinning /> Ejecutando…
                    </>
                  ) : (
                    "Iniciar refresh"
                  )}
                </button>
                {!running && (
                  <button className={styles.btnCancel} onClick={handleClose}>
                    {done ? "Cerrar" : "Cancelar"}
                  </button>
                )}
              </div>

              {/* Terminal log */}
              {log.length > 0 && (
                <div className={styles.terminalWrap}>
                  <div className={styles.terminalLabel}>Log</div>
                  <div className={styles.terminal} ref={terminalRef}>
                    {log.map((line, i) => (
                      <div key={i} className={`${styles.logLine} ${statusClass[line.status]}`}>
                        <span className={styles.logTime}>{line.time}</span>
                        <span className={styles.logStep}>{line.step}</span>
                        <span className={styles.logIcon}>{statusIcon[line.status]}</span>
                        <span className={styles.logMsg}>{line.msg}</span>
                      </div>
                    ))}
                    {done && <div className={styles.done}>— refresh completado —</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
