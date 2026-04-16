"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchCandles, fetchPairs, TIMEFRAMES, getTimeframeLabel } from "@/lib/binance";
import { predict, resultToCandles } from "@/lib/kronos";
import type { Candle, Timeframe, TradingPair } from "@/lib/binance";
import styles from "./kronos.module.css";

type Status = "idle" | "loading-candles" | "predicting" | "done" | "error";

export default function KronosClient() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);

  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [predicted, setPredicted] = useState<Candle[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  function log(msg: string) {
    const ts = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
    // Auto-scroll
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  }

  // Load pairs on mount
  useEffect(() => {
    fetchPairs().then((p) => {
      setPairs(p);
      log(`${p.length} pares USDT cargados desde Binance`);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load candles when symbol or timeframe changes
  const loadCandles = useCallback(async (sym: string, tf: Timeframe) => {
    setStatus("loading-candles");
    setError(null);
    setPredicted([]);
    log(`Solicitando 512 velas ${tf} para ${sym}...`);
    const t0 = performance.now();
    try {
      const data = await fetchCandles(sym, tf, 512);
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setCandles(data);
      log(`${data.length} velas recibidas (${elapsed}s) — rango: ${new Date(data[0].time * 1000).toLocaleDateString("es-ES")} → ${new Date(data[data.length - 1].time * 1000).toLocaleDateString("es-ES")}`);
      setStatus("idle");
    } catch (e) {
      log(`ERROR: ${e instanceof Error ? e.message : "fallo en fetch"}`);
      setError(e instanceof Error ? e.message : "Error al cargar velas");
      setStatus("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
  useEffect(() => {
    loadCandles(symbol, timeframe);
  }, [symbol, timeframe, loadCandles]);

  // Render chart with lightweight-charts
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    let disposed = false;

    (async () => {
      const { createChart, ColorType, CandlestickSeries, LineSeries } = await import("lightweight-charts");

      if (disposed || !chartRef.current) return;

      // Dispose previous chart
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

      // Historical candles
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

      // Predicted candles (if any) — rendered as a line series for distinction
      if (predicted.length > 0) {
        // Connect prediction to last historical candle
        const lastHistorical = candles[candles.length - 1];
        const predictionData = [
          { time: lastHistorical.time as import("lightweight-charts").UTCTimestamp, value: lastHistorical.close },
          ...predicted.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp,
            value: c.close,
          })),
        ];

        const predLine = chart.addSeries(LineSeries, {
          color: isDark ? "#6B8EA0" : "#2b5d73",
          lineWidth: 2,
          lineStyle: 2, // dashed
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
        });

        predLine.setData(predictionData);

        // Also show prediction high/low as area
        const predHighLine = chart.addSeries(LineSeries, {
          color: isDark ? "#6B8EA040" : "#2b5d7330",
          lineWidth: 1,
          lineStyle: 2,
          crosshairMarkerVisible: false,
        });

        predHighLine.setData(predicted.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          value: c.high,
        })));

        const predLowLine = chart.addSeries(LineSeries, {
          color: isDark ? "#6B8EA040" : "#2b5d7330",
          lineWidth: 1,
          lineStyle: 2,
          crosshairMarkerVisible: false,
        });

        predLowLine.setData(predicted.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          value: c.low,
        })));
      }

      chart.timeScale().fitContent();

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (chartRef.current && chartInstance.current) {
          chartInstance.current.applyOptions({ width: chartRef.current.clientWidth });
        }
      });
      ro.observe(chartRef.current);

      return () => {
        ro.disconnect();
      };
    })();

    return () => {
      disposed = true;
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [candles, predicted]);

  // Run prediction
  async function handlePredict() {
    if (candles.length === 0) return;
    setStatus("predicting");
    setError(null);
    setPredicted([]);

    const lastCandle = candles[candles.length - 1];
    const lastPrice = lastCandle.close;

    log(`── Iniciando predicción ──`);
    log(`Activo: ${currentBase}/USDT | Timeframe: ${getTimeframeLabel(timeframe)} | Velas de entrada: ${candles.length}`);
    log(`Último cierre: $${lastPrice.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`);
    log(`Preparando payload OHLCV (${candles.length}×4 matrix)...`);
    log(`Enviando al modelo Kronos (prediction_length=24)...`);

    const t0 = performance.now();

    try {
      const result = await predict(candles, 24);
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const predCandles = resultToCandles(result);

      log(`Respuesta recibida en ${elapsed}s — ${predCandles.length} velas predichas`);

      if (predCandles.length > 0) {
        const firstPred = predCandles[0];
        const lastPred = predCandles[predCandles.length - 1];
        const predHigh = Math.max(...predCandles.map((c) => c.high));
        const predLow = Math.min(...predCandles.map((c) => c.low));
        const delta = ((lastPred.close - lastPrice) / lastPrice * 100).toFixed(2);
        const sign = Number(delta) >= 0 ? "+" : "";

        log(`Rango predicho: $${predLow.toLocaleString("es-ES", { maximumFractionDigits: 2 })} — $${predHigh.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`);
        log(`Cierre final predicho: $${lastPred.close.toLocaleString("es-ES", { maximumFractionDigits: 2 })} (${sign}${delta}%)`);
        log(`Periodo: ${new Date(firstPred.time * 1000).toLocaleString("es-ES")} → ${new Date(lastPred.time * 1000).toLocaleString("es-ES")}`);
      }

      log(`── Predicción completada ──`);
      setPredicted(predCandles);
      setStatus("done");
    } catch (e) {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const msg = e instanceof Error ? e.message : "Error desconocido";
      log(`ERROR después de ${elapsed}s: ${msg}`);
      setError(msg);
      setStatus("error");
    }
  }

  // Filter pairs by search
  const filteredPairs = search.trim()
    ? pairs.filter((p) => p.base.toLowerCase().includes(search.trim().toLowerCase()))
    : pairs.slice(0, 20); // Show top 20 by default

  const currentBase = pairs.find((p) => p.symbol === symbol)?.base ?? symbol.replace("USDT", "");

  return (
    <div className={`page-transition ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kronos</h1>
        <p className={styles.subtitle}>
          Predicción de velas con inteligencia artificial.
        </p>
      </header>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        {/* Asset selector */}
        <div className={styles.assetSelector}>
          <button className={styles.assetBtn}>
            <span className={styles.assetName}>{currentBase}/USDT</span>
          </button>
          <div className={styles.assetDropdown}>
            <input
              className={styles.assetSearch}
              type="text"
              placeholder="Buscar activo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.assetList}>
              {filteredPairs.map((p) => (
                <button
                  key={p.symbol}
                  className={`${styles.assetOption} ${p.symbol === symbol ? styles.assetOptionActive : ""}`}
                  onClick={() => {
                    setSymbol(p.symbol);
                    setSearch("");
                  }}
                >
                  {p.base}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeframe selector */}
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

        {/* Predict button */}
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

      {/* ── Status ── */}
      {status === "loading-candles" && (
        <div className={styles.statusBar}>
          <span className={styles.spinner} /> Cargando velas...
        </div>
      )}
      {status === "done" && predicted.length > 0 && (
        <div className={styles.statusBar}>
          <span className={styles.statusDot} />
          {predicted.length} velas predichas para {currentBase}/USDT ({getTimeframeLabel(timeframe)})
        </div>
      )}
      {error && (
        <div className={styles.errorBar}>{error}</div>
      )}

      {/* ── Chart ── */}
      <div className={styles.chartWrap}>
        <div ref={chartRef} className={styles.chart} />
      </div>

      {/* ── Legend ── */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDotHistorical} />
          Histórico
        </span>
        {predicted.length > 0 && (
          <span className={styles.legendItem}>
            <span className={styles.legendDotPrediction} />
            Predicción Kronos
          </span>
        )}
      </div>

      {/* ── Terminal log ── */}
      {logs.length > 0 && (
        <div className={styles.terminal}>
          <div className={styles.terminalHeader}>
            <span className={styles.terminalTitle}>Log</span>
            <button
              className={styles.terminalClear}
              onClick={() => setLogs([])}
            >
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
  );
}
