"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { fetchCandles, fetchPairs, TIMEFRAMES, getTimeframeLabel } from "@/lib/binance";
import { predict, resultToCandles } from "@/lib/kronos";
import type { Candle, Timeframe, TradingPair } from "@/lib/binance";
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
  const [search, setSearch] = useState("");
  const [assetOpen, setAssetOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [predView, setPredView] = useState<"candles" | "line">("candles");
  const [error, setError] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [predicted, setPredicted] = useState<Candle[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

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

      const isDark = document.documentElement.getAttribute("data-theme") !== "light";

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 420,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: isDark ? "#8B9099" : "#5d5044",
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: isDark ? "#1E2229" : "#c9b89f40" },
          horzLines: { color: isDark ? "#1E2229" : "#c9b89f40" },
        },
        crosshair: {
          vertLine: { color: isDark ? "#6B8EA050" : "#2b5d7350" },
          horzLine: { color: isDark ? "#6B8EA050" : "#2b5d7350" },
        },
        timeScale: {
          borderColor: isDark ? "#1E2229" : "#c9b89f",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: isDark ? "#1E2229" : "#c9b89f",
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
  }, [candles, predicted, predView]);

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
    log(`Contexto: ${candles.length} velas OHLCV`);
    log(`Último cierre: $${lastPrice.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`);
    log(`Modelo: Kronos-small (transformer, max_context=512)`);
    log(`Parámetros: pred_len=24, T=1.0, top_p=0.9`);
    log(`Tokenizando input...`);
    log(`POST /api/kronos/predict → modal.run (GPU T4)`);

    const t0 = performance.now();

    try {
      const result = await predict(candles, 24);
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
        <h1 className={styles.title}>Kronos</h1>
        <p className={styles.subtitle}>
          Transformer entrenado en series OHLCV. 512 velas de contexto, 24 hacia adelante.
          <br />
          <span className={styles.subtitleMuted}>
            No es consejo financiero. Una forma de explorar qué <em>ve</em> un modelo en el mercado.
          </span>
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

      {/* ── Chart ── */}
      <div className={styles.chartWrap}>
        <div className={styles.chartMeta}>
          <span className={styles.chartMetaAsset}>{currentBase}/USDT · {getTimeframeLabel(timeframe)}</span>
        </div>
        <div ref={chartRef} className={styles.chart} />
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
              >
                Velas
              </button>
              <button
                className={`${styles.viewBtn} ${predView === "line" ? styles.viewBtnActive : ""}`}
                onClick={() => setPredView("line")}
              >
                Línea
              </button>
            </div>
            <button
              className={styles.shareBtn}
              onClick={() => setSaveOpen(!saveOpen)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {savedId ? "Guardada" : "Guardar"}
            </button>
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

      {/* ── Terminal log ── */}
      {logs.length > 0 && (
        <div className={styles.terminal}>
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
    </div>
  );
}
