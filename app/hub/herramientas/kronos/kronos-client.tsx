"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchCandles, fetchPairs, TIMEFRAMES, getTimeframeLabel } from "@/lib/binance";
import { predict, resultToCandles, KRONOS_MODELS } from "@/lib/kronos";
import type { Candle, Timeframe, TradingPair } from "@/lib/binance";
import type { KronosModel } from "@/lib/kronos";
import styles from "./kronos.module.css";

type Status = "idle" | "loading-candles" | "predicting" | "done" | "error";

interface HistoryItem {
  id: string;
  symbol: string;
  timeframe: string;
  comment: string | null;
  pred_range_start: string;
  pred_range_end: string;
  created_at: string;
}

function friendlyError(msg: string): string {
  if (/timeout|timed out|aborted/i.test(msg)) {
    return "El modelo está arrancando (cold start). Puede tardar hasta 30s. Reintenta en unos segundos.";
  }
  if (/502|503|504/i.test(msg)) {
    return "El servicio Kronos no responde. Reintenta en un momento.";
  }
  if (/401|Unauthorized/i.test(msg)) {
    return "Necesitas iniciar sesión para usar Kronos.";
  }
  if (/Failed to fetch/i.test(msg)) {
    return "No se pudo conectar con el servidor. Comprueba tu conexión.";
  }
  return msg;
}

export default function KronosClient() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const assetSelectorRef = useRef<HTMLDivElement>(null);

  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [model, setModel] = useState<KronosModel>("small");
  const [hoveredModel, setHoveredModel] = useState<KronosModel | null>(null);
  const [search, setSearch] = useState("");
  const [assetOpen, setAssetOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [predView, setPredView] = useState<"candles" | "line">("candles");
  const [error, setError] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [predicted, setPredicted] = useState<Candle[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Track theme via data-theme attribute on <html>
  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Share form
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveEmail, setSaveEmail] = useState("");
  const [saveComment, setSaveComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  function log(msg: string) {
    const ts = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  }

  // Load pairs on mount
  useEffect(() => {
    log(`Conectando a Binance data-api.binance.vision...`);
    fetchPairs().then((p) => {
      setPairs(p);
      log(`${p.length} pares USDT activos encontrados (status=TRADING)`);
    }).catch((e) => {
      log(`ERROR Binance exchangeInfo: ${e.message}`);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load history on mount
  useEffect(() => {
    fetch("/api/kronos/history")
      .then((r) => r.json())
      .then((d) => setHistory(d.items ?? []))
      .catch(() => {});
  }, [savedId]);

  // Close asset dropdown on outside click
  useEffect(() => {
    if (!assetOpen) return;
    function handle(e: MouseEvent) {
      if (assetSelectorRef.current && !assetSelectorRef.current.contains(e.target as Node)) {
        setAssetOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [assetOpen]);

  // Close asset dropdown on Escape
  useEffect(() => {
    if (!assetOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAssetOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [assetOpen]);

  const loadCandles = useCallback(async (sym: string, tf: Timeframe) => {
    setStatus("loading-candles");
    setError(null);
    setPredicted([]);
    setSavedId(null);
    log(`GET /klines?symbol=${sym}&interval=${tf}&limit=512`);
    const t0 = performance.now();
    try {
      const data = await fetchCandles(sym, tf, 512);
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setCandles(data);
      const first = new Date(data[0].time * 1000);
      const last = new Date(data[data.length - 1].time * 1000);
      log(`← ${data.length} velas (${elapsed}s) | ${first.toLocaleDateString("es-ES")} ${first.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} → ${last.toLocaleDateString("es-ES")} ${last.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`);
      log(`Rango de precio: $${Math.min(...data.map(c=>c.low)).toLocaleString("es-ES", {maximumFractionDigits:2})} — $${Math.max(...data.map(c=>c.high)).toLocaleString("es-ES", {maximumFractionDigits:2})}`);
      setStatus("idle");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fallo en fetch";
      log(`ERROR: ${msg}`);
      setError(friendlyError(msg));
      setStatus("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCandles(symbol, timeframe);
  }, [symbol, timeframe, loadCandles]);

  // Render chart
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    let disposed = false;

    (async () => {
      const { createChart, ColorType, CandlestickSeries, LineSeries } = await import("lightweight-charts");

      if (disposed || !chartRef.current) return;

      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 420,
        layout: {
          background: { type: ColorType.Solid, color: isDark ? "#0C0E11" : "#ede1d1" },
          textColor: isDark ? "#8B9099" : "#4a3f35",
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 11,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: isDark ? "#1E2229" : "#c9b89f" },
          horzLines: { color: isDark ? "#1E2229" : "#c9b89f" },
        },
        crosshair: {
          vertLine: { color: isDark ? "#6B8EA050" : "#2b5d7380" },
          horzLine: { color: isDark ? "#6B8EA050" : "#2b5d7380" },
        },
        timeScale: {
          borderColor: isDark ? "#1E2229" : "#b5a48c",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: isDark ? "#1E2229" : "#b5a48c",
        },
      });

      chartInstance.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: isDark ? "#5BAA7C" : "#2a7348",
        downColor: isDark ? "#C7555A" : "#a8333a",
        borderUpColor: isDark ? "#5BAA7C" : "#2a7348",
        borderDownColor: isDark ? "#C7555A" : "#a8333a",
        wickUpColor: isDark ? "#5BAA7C80" : "#2a734880",
        wickDownColor: isDark ? "#C7555A80" : "#a8333a80",
      });

      candleSeries.setData(candles.map((c) => ({
        time: c.time as import("lightweight-charts").UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })));

      if (predicted.length > 0) {
        if (predView === "candles") {
          const predCandleSeries = chart.addSeries(CandlestickSeries, {
            upColor: isDark ? "#6B8EA0" : "#2b5d73",
            downColor: isDark ? "#4A6E80" : "#1e4a5c",
            borderUpColor: isDark ? "#6B8EA0" : "#2b5d73",
            borderDownColor: isDark ? "#4A6E80" : "#1e4a5c",
            wickUpColor: isDark ? "#6B8EA080" : "#2b5d7380",
            wickDownColor: isDark ? "#4A6E8080" : "#1e4a5c80",
          });

          predCandleSeries.setData(predicted.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })));
        } else {
          const lastHistorical = candles[candles.length - 1];
          const predLine = chart.addSeries(LineSeries, {
            color: isDark ? "#6B8EA0" : "#2b5d73",
            lineWidth: 2,
            lineStyle: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 3,
          });
          predLine.setData([
            { time: lastHistorical.time as import("lightweight-charts").UTCTimestamp, value: lastHistorical.close },
            ...predicted.map((c) => ({
              time: c.time as import("lightweight-charts").UTCTimestamp,
              value: c.close,
            })),
          ]);

          const predHighLine = chart.addSeries(LineSeries, {
            color: isDark ? "#6B8EA040" : "#2b5d7330",
            lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false,
          });
          predHighLine.setData(predicted.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp, value: c.high,
          })));

          const predLowLine = chart.addSeries(LineSeries, {
            color: isDark ? "#6B8EA040" : "#2b5d7330",
            lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false,
          });
          predLowLine.setData(predicted.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp, value: c.low,
          })));
        }
      }

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (chartRef.current && chartInstance.current) {
          chartInstance.current.applyOptions({ width: chartRef.current.clientWidth });
        }
      });
      ro.observe(chartRef.current);

      return () => ro.disconnect();
    })();

    return () => {
      disposed = true;
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [candles, predicted, predView, isDark]);

  const currentBase = pairs.find((p) => p.symbol === symbol)?.base ?? symbol.replace("USDT", "");

  async function handlePredict() {
    if (candles.length === 0) return;
    setStatus("predicting");
    setError(null);
    setPredicted([]);
    setSavedId(null);

    const lastCandle = candles[candles.length - 1];
    const lastPrice = lastCandle.close;

    log(`────── predict() ──────`);
    log(`Asset: ${currentBase}/USDT`);
    log(`Timeframe: ${timeframe} (${getTimeframeLabel(timeframe)})`);
    const modelInfo = KRONOS_MODELS.find((m) => m.id === model)!;
    const contextUsed = Math.min(candles.length, modelInfo.contextLen);

    log(`Contexto: ${contextUsed} velas OHLCV (max ${modelInfo.contextLen})`);
    log(`Último cierre: $${lastPrice.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`);
    log(`Modelo: Kronos-${model} (${modelInfo.params} params, max_context=${modelInfo.contextLen})`);
    log(`Parámetros: pred_len=24, T=1.0, top_p=0.9`);
    log(`Tokenizando input...`);
    log(`POST /api/kronos/predict → modal.run (GPU T4)`);

    const t0 = performance.now();

    try {
      const result = await predict(candles, 24, model);
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const predCandles = resultToCandles(result);

      if (Number(elapsed) > 15) log(`Cold start detectado (${elapsed}s) — modelo cargado`);
      log(`← ${predCandles.length} velas predichas (${elapsed}s total)`);

      if (predCandles.length > 0) {
        const firstPred = predCandles[0];
        const lastPred = predCandles[predCandles.length - 1];
        const predHigh = Math.max(...predCandles.map((c) => c.high));
        const predLow = Math.min(...predCandles.map((c) => c.low));
        const delta = ((lastPred.close - lastPrice) / lastPrice * 100).toFixed(2);
        const sign = Number(delta) >= 0 ? "+" : "";

        log(`Rango predicho: $${predLow.toLocaleString("es-ES", { maximumFractionDigits: 2 })} — $${predHigh.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`);
        log(`Cierre final: $${lastPred.close.toLocaleString("es-ES", { maximumFractionDigits: 2 })} (${sign}${delta}% vs último)`);
        log(`Horizonte: ${new Date(firstPred.time * 1000).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} → ${new Date(lastPred.time * 1000).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`);
      }

      log(`────── done ──────`);
      setPredicted(predCandles);
      setStatus("done");
    } catch (e) {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const msg = e instanceof Error ? e.message : "Error desconocido";
      log(`ERROR tras ${elapsed}s: ${msg}`);
      setError(friendlyError(msg));
      setStatus("error");
    }
  }

  async function handleSave() {
    if (predicted.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/kronos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          timeframe,
          model,
          email: saveEmail.trim() || undefined,
          comment: saveComment.trim() || undefined,
          inputCandles: candles,
          predictedCandles: predicted,
          inputRange: {
            start: new Date(candles[0].time * 1000).toISOString(),
            end: new Date(candles[candles.length - 1].time * 1000).toISOString(),
          },
          predRange: {
            start: new Date(predicted[0].time * 1000).toISOString(),
            end: new Date(predicted[predicted.length - 1].time * 1000).toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.id) {
        setSavedId(data.id);
        log(`Predicción guardada: id=${data.id.slice(0, 8)}`);
        setSaveOpen(false);
        setSaveEmail("");
        setSaveComment("");
      }
    } catch (e) {
      log(`ERROR al guardar: ${e instanceof Error ? e.message : "desconocido"}`);
    } finally {
      setSaving(false);
    }
  }

  const filteredPairs = search.trim()
    ? pairs.filter((p) => p.base.toLowerCase().includes(search.trim().toLowerCase()))
    : pairs.slice(0, 30);

  return (
    <div className={`page-transition ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Image
            src="/kronos/logo.svg"
            alt="Kronos"
            width={36}
            height={36}
            className={styles.titleLogo}
            priority
          />
          <span>Kronos</span>
        </h1>
        <p className={styles.subtitle}>
          Transformer entrenado en series OHLCV. Hasta 2048 velas de contexto, 24 hacia adelante. Tres tamaños de modelo: <code>mini</code>, <code>small</code>, <code>base</code>.
        </p>
      </header>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        {/* Asset selector */}
        <div className={styles.assetSelector} ref={assetSelectorRef}>
          <button
            className={`${styles.assetBtn} ${assetOpen ? styles.assetBtnOpen : ""}`}
            onClick={() => setAssetOpen(!assetOpen)}
            aria-expanded={assetOpen}
            aria-haspopup="listbox"
          >
            <span className={styles.assetName}>{currentBase}/USDT</span>
            <svg className={styles.assetChevron} width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 4L5 6.5L7.5 4" />
            </svg>
          </button>
          {assetOpen && (
            <div className={styles.assetDropdown}>
              <input
                className={styles.assetSearch}
                type="text"
                placeholder="Buscar activo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
              <div className={styles.assetList} role="listbox">
                {filteredPairs.length === 0 ? (
                  <span className={styles.assetEmpty}>Sin resultados</span>
                ) : (
                  filteredPairs.map((p) => (
                    <button
                      key={p.symbol}
                      role="option"
                      aria-selected={p.symbol === symbol}
                      className={`${styles.assetOption} ${p.symbol === symbol ? styles.assetOptionActive : ""}`}
                      onClick={() => {
                        setSymbol(p.symbol);
                        setSearch("");
                        setAssetOpen(false);
                      }}
                    >
                      {p.base}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timeframe */}
        <div className={styles.tfGroup}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`${styles.tfBtn} ${tf === timeframe ? styles.tfBtnActive : ""}`}
              onClick={() => setTimeframe(tf)}
            >
              {getTimeframeLabel(tf)}
            </button>
          ))}
        </div>

        {/* Model selector */}
        <div className={styles.modelSelector}>
          <div className={styles.modelGroup}>
            {KRONOS_MODELS.map((m) => (
              <button
                key={m.id}
                className={`${styles.modelBtn} ${m.id === model ? styles.modelBtnActive : ""}`}
                onClick={() => setModel(m.id)}
                onMouseEnter={() => setHoveredModel(m.id)}
                onMouseLeave={() => setHoveredModel(null)}
                aria-label={m.label}
              >
                <ModelIcon model={m.id} />
                <span className={styles.modelLabel}>{m.label}</span>
              </button>
            ))}
          </div>
          {(() => {
            const active = KRONOS_MODELS.find((m) => m.id === (hoveredModel ?? model));
            if (!active) return null;
            return (
              <div className={styles.modelInfo}>
                <span className={styles.modelInfoParams}>{active.params}</span>
                <span className={styles.modelInfoSep}>·</span>
                <span className={styles.modelInfoCtx}>ctx {active.contextLen}</span>
                <span className={styles.modelInfoDesc}>{active.description}</span>
              </div>
            );
          })()}
        </div>

        <div className={styles.actionsGroup}>
          <button
            className={styles.predictBtn}
            onClick={handlePredict}
            disabled={status === "predicting" || status === "loading-candles" || candles.length === 0}
          >
            {status === "predicting" ? (
              <>
                <span className={styles.spinner} />
                Prediciendo...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Predecir
              </>
            )}
          </button>

          {predicted.length > 0 && (
            <button
              className={`${styles.saveBtn} ${savedId ? styles.saveBtnDone : ""}`}
              onClick={() => setSaveOpen(!saveOpen)}
              title={savedId ? "Guardada" : "Guardar predicción"}
            >
              {savedId ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              {savedId ? "Guardada" : "Guardar"}
            </button>
          )}
        </div>
      </div>

      {/* ── Status/Error ── */}
      {status === "loading-candles" && (
        <div className={styles.statusBar}>
          <span className={styles.spinner} /> Cargando velas...
        </div>
      )}
      {error && (
        <div className={styles.errorBar}>
          <span className={styles.errorText}>{error}</span>
          <button
            className={styles.retryBtn}
            onClick={() => {
              if (status === "error" && candles.length === 0) {
                loadCandles(symbol, timeframe);
              } else {
                handlePredict();
              }
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Reintentar
          </button>
        </div>
      )}

      {/* ── Chart + side log ── */}
      <div className={styles.chartLayout}>
        <div className={styles.chartWrap}>
          <div ref={chartRef} className={styles.chart} />
        </div>

        {/* Terminal log — shown beside chart on desktop, below on mobile */}
        {logs.length > 0 && (
          <div className={`${styles.terminal} ${styles.terminalSide}`}>
            <div className={styles.terminalHeader}>
              <span className={styles.terminalTitle}>Log</span>
              <button className={styles.terminalClear} onClick={() => setLogs([])}>
                Limpiar
              </button>
            </div>
            <div ref={logRef} className={styles.terminalBody}>
              {logs.map((line, i) => (
                <div
                  key={i}
                  className={`${styles.terminalLine} ${line.includes("ERROR") ? styles.terminalError : ""} ${line.includes("──") ? styles.terminalSeparator : ""}`}
                >
                  {line}
                </div>
              ))}
              {status === "predicting" && (
                <div className={styles.terminalLine}>
                  <span className={styles.terminalCursor}>_</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend + view toggle + share ── */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDotHistorical} />
          Histórico
        </span>
        {predicted.length > 0 && (
          <>
            <span className={styles.legendItem}>
              <span className={styles.legendDotPrediction} />
              Kronos
            </span>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${predView === "candles" ? styles.viewBtnActive : ""}`}
                onClick={() => setPredView("candles")}
                title="Ver como velas"
                aria-label="Ver como velas"
              >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                  <line x1="3" y1="1" x2="3" y2="11" />
                  <rect x="1.5" y="3" width="3" height="6" fill="currentColor" fillOpacity="0.25" />
                  <line x1="7" y1="0.5" x2="7" y2="11.5" />
                  <rect x="5.5" y="2" width="3" height="8" fill="currentColor" fillOpacity="0.25" />
                  <line x1="11" y1="2" x2="11" y2="10" />
                  <rect x="9.5" y="4" width="3" height="4" fill="currentColor" fillOpacity="0.25" />
                </svg>
                <span>Velas</span>
              </button>
              <button
                className={`${styles.viewBtn} ${predView === "line" ? styles.viewBtnActive : ""}`}
                onClick={() => setPredView("line")}
                title="Ver como línea"
                aria-label="Ver como línea"
              >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 9 4 6 7 7.5 10 3 13 4.5" />
                </svg>
                <span>Línea</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Save form ── */}
      {saveOpen && (
        <div className={styles.saveBlock}>
          <div className={styles.saveHeader}>
            <span>Guardar predicción</span>
            <button
              className={styles.saveClose}
              onClick={() => setSaveOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <input
            type="email"
            className={styles.saveInput}
            placeholder="Email (opcional, para recibir actualizaciones)"
            value={saveEmail}
            onChange={(e) => setSaveEmail(e.target.value)}
          />
          <textarea
            className={styles.saveTextarea}
            placeholder="Comentario (opcional): ¿qué ves? ¿qué esperas?"
            value={saveComment}
            onChange={(e) => setSaveComment(e.target.value)}
            rows={2}
          />
          <button
            className={styles.savePrimary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar predicción"}
          </button>
        </div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div className={styles.historyBlock}>
          <div className={styles.historyHeader}>
            <span className={styles.historyTitle}>Predicciones recientes</span>
            <span className={styles.historyCount}>{history.length}</span>
          </div>
          <div className={styles.historyList}>
            {history.map((h) => (
              <Link key={h.id} href={`/kronos/p/${h.id}`} className={styles.historyItem}>
                <span className={styles.historyAsset}>{h.symbol.replace("USDT", "")}/USDT</span>
                <span className={styles.historyTf}>{h.timeframe}</span>
                {h.comment && <span className={styles.historyComment}>&ldquo;{h.comment}&rdquo;</span>}
                <span className={styles.historyDate}>
                  {new Date(h.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Newsletter CTA ── */}
      <div className={styles.footerCta}>
        <Link href="/newsletter" className={styles.ctaLink}>
          <span className={styles.ctaLabel}>Más análisis →</span>
          <span className={styles.ctaSubtext}>Newsletter de Chamillion sobre mercados, cripto y herramientas de análisis.</span>
        </Link>
      </div>

      {/* ── Credits ── */}
      <div className={styles.credits}>
        <span className={styles.creditsLabel}>Créditos</span>
        <span>
          Modelo{" "}
          <a href={`https://huggingface.co/NeoQuasar/Kronos-${model}`} target="_blank" rel="noopener noreferrer" className={styles.creditLink}>
            NeoQuasar/Kronos-{model}
          </a>
          {" "}·{" "}Código{" "}
          <a href="https://github.com/shiyu-coder/Kronos" target="_blank" rel="noopener noreferrer" className={styles.creditLink}>
            shiyu-coder/Kronos
          </a>
          {" "}(MIT) · Datos{" "}
          <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className={styles.creditLink}>
            Binance
          </a>
        </span>
      </div>

      {/* ── Disclaimer ── */}
      <div className={styles.disclaimer}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          <strong>No es consejo financiero.</strong>{" "}
          Kronos es un experimento de modelado: una forma de explorar qué <em>ve</em> un modelo de IA en el mercado. Las predicciones pueden ser inexactas, sesgadas o sencillamente equivocadas. No tomes decisiones de inversión basadas en esta herramienta.
        </span>
      </div>
    </div>
  );
}

/**
 * Visual representation of model complexity — nodes and connections
 * suggesting increasing neural network density.
 */
function ModelIcon({ model }: { model: KronosModel }) {
  if (model === "mini") {
    // 2 layers, 2 nodes each: simplest
    return (
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <circle cx="3" cy="3" r="1.3" />
        <circle cx="3" cy="9" r="1.3" />
        <circle cx="15" cy="3" r="1.3" />
        <circle cx="15" cy="9" r="1.3" />
        <line x1="4.3" y1="3" x2="13.7" y2="3" />
        <line x1="4.3" y1="9" x2="13.7" y2="9" />
        <line x1="4.3" y1="3" x2="13.7" y2="9" opacity="0.4" />
        <line x1="4.3" y1="9" x2="13.7" y2="3" opacity="0.4" />
      </svg>
    );
  }

  if (model === "small") {
    // 3 layers, 3 nodes each: medium
    return (
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        {[2, 9, 16].map((x) =>
          [2, 6, 10].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />)
        )}
        {[2, 6, 10].map((y1) =>
          [2, 6, 10].map((y2) => (
            <line
              key={`a-${y1}-${y2}`}
              x1="3"
              y1={y1}
              x2="8"
              y2={y2}
              opacity={y1 === y2 ? 1 : 0.35}
            />
          ))
        )}
        {[2, 6, 10].map((y1) =>
          [2, 6, 10].map((y2) => (
            <line
              key={`b-${y1}-${y2}`}
              x1="10"
              y1={y1}
              x2="15"
              y2={y2}
              opacity={y1 === y2 ? 1 : 0.35}
            />
          ))
        )}
      </svg>
    );
  }

  // base — 4 layers, 4 nodes each: dense
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
      {[1.5, 7, 12.5].map((x) =>
        [1.5, 4.7, 7.9, 11].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="currentColor" fillOpacity="0.3" />
        ))
      )}
      {[1.5, 4.7, 7.9, 11].map((y1) =>
        [1.5, 4.7, 7.9, 11].map((y2) => (
          <line
            key={`a-${y1}-${y2}`}
            x1="2.2"
            y1={y1}
            x2="6.3"
            y2={y2}
            opacity="0.55"
          />
        ))
      )}
      {[1.5, 4.7, 7.9, 11].map((y1) =>
        [1.5, 4.7, 7.9, 11].map((y2) => (
          <line
            key={`b-${y1}-${y2}`}
            x1="7.7"
            y1={y1}
            x2="11.8"
            y2={y2}
            opacity="0.55"
          />
        ))
      )}
      <circle cx="16" cy="6" r="1.1" fill="currentColor" fillOpacity="0.5" />
      {[1.5, 4.7, 7.9, 11].map((y) => (
        <line key={`out-${y}`} x1="13.2" y1={y} x2="15" y2="6" opacity="0.4" />
      ))}
    </svg>
  );
}


