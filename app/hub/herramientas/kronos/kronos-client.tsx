"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTimeframeLabel } from "@/lib/binance";
import { predict, resultToCandles, KRONOS_MODELS } from "@/lib/kronos";
import type { Candle, Timeframe } from "@/lib/binance";
import type { KronosModel } from "@/lib/kronos";
import {
  CATALOG,
  FREE_ASSETS,
  PREMIUM_CRYPTO_FAVORITES,
  categoryLabel,
  type AssetCategory,
  type AssetMeta,
} from "@/lib/assets";
import styles from "./kronos.module.css";

type Status = "idle" | "loading-candles" | "predicting" | "done" | "error";

interface HistoryItem {
  id: string;
  symbol: string;
  timeframe: string;
  model: string | null;
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

function formatHistorySymbol(symbol: string): string {
  if (/USDT$/.test(symbol)) return `${symbol.replace("USDT", "")}/USDT`;
  // Known catalog match gets a pretty label
  const asset = CATALOG.find((a) => a.symbol === symbol);
  if (asset) return asset.label;
  return symbol;
}

function buildDefaultComment(
  asset: AssetMeta,
  timeframe: string,
  model: string,
  candles: Candle[],
  predicted: Candle[],
): string {
  if (candles.length === 0 || predicted.length === 0) return "";
  const lastPrice = candles[candles.length - 1].close;
  const lastPred = predicted[predicted.length - 1].close;
  const delta = ((lastPred - lastPrice) / lastPrice) * 100;
  const sign = delta >= 0 ? "+" : "";
  const fmt = (n: number) =>
    n >= 1000
      ? n.toLocaleString("es-ES", { maximumFractionDigits: 0 })
      : n.toLocaleString("es-ES", { maximumFractionDigits: 4 });
  return `Predicción de ${asset.label} en ${timeframe} con Kronos-${model}. Último cierre ${fmt(lastPrice)} → cierre predicho ${fmt(lastPred)} (${sign}${delta.toFixed(2)}%) a 24 velas.`;
}

export type KronosMode = "member" | "anon";

interface StatusInfo {
  enabled: boolean;
  reason: "kill_switch" | "global_cap" | null;
  globalResetsAt: string | null;
  remaining: number | null;
  resetsAt: string | null;
  max: number | null;
  twelveDataBlocked?: boolean;
  twelveDataUntil?: string | null;
}

export default function KronosClient({
  mode = "member",
  isAdmin = false,
}: { mode?: KronosMode; isAdmin?: boolean } = {}) {
  const isAnon = mode === "anon";
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const assetSelectorRef = useRef<HTMLDivElement>(null);

  const [extraAssets, setExtraAssets] = useState<AssetMeta[]>([]);
  const [assetId, setAssetId] = useState("btc");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "all">("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [model, setModel] = useState<KronosModel>(isAnon ? "mini" : "small");
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [offline, setOffline] = useState(false);
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
  const [predictElapsed, setPredictElapsed] = useState(0);

  const allAssets = useMemo<AssetMeta[]>(() => [...CATALOG, ...extraAssets], [extraAssets]);
  const currentAsset = useMemo<AssetMeta>(
    () => allAssets.find((a) => a.id === assetId) ?? FREE_ASSETS[0],
    [allAssets, assetId],
  );

  // If user switches to an asset whose TFs exclude the current one, snap to 1h
  useEffect(() => {
    if (!currentAsset.timeframes.includes(timeframe)) {
      setTimeframe(currentAsset.timeframes[0] ?? "1h");
    }
  }, [currentAsset, timeframe]);

  // Tick elapsed time while predicting (0.1s resolution)
  useEffect(() => {
    if (status !== "predicting") {
      setPredictElapsed(0);
      return;
    }
    const start = performance.now();
    const id = setInterval(() => {
      setPredictElapsed((performance.now() - start) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

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

  // Lock body scroll + Esc-to-close while the save dialog is open
  useEffect(() => {
    if (!saveOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSaveOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [saveOpen]);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  function log(msg: string) {
    const ts = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  }

  // Load Binance extra pairs — only for members (anon has the curated free list + premium teasers)
  useEffect(() => {
    if (isAnon) return;
    log(`Conectando a Binance data-api.binance.vision...`);
    fetch("https://data-api.binance.vision/api/v3/exchangeInfo?permissions=SPOT")
      .then((r) => r.json())
      .then((data: { symbols: { symbol: string; baseAsset: string; quoteAsset: string; status: string }[] }) => {
        const reserved = new Set(CATALOG.filter((a) => a.source === "binance").map((a) => a.symbol));
        const favSet = new Set(PREMIUM_CRYPTO_FAVORITES);
        const extras: AssetMeta[] = data.symbols
          .filter((s) => s.quoteAsset === "USDT" && s.status === "TRADING" && !reserved.has(s.symbol))
          .map((s) => ({
            id: `bnb-${s.baseAsset.toLowerCase()}`,
            symbol: s.symbol,
            source: "binance" as const,
            label: s.baseAsset,
            sublabel: `${s.baseAsset}/USDT`,
            category: "crypto" as const,
            tier: "premium" as const,
            timeframes: ["1h", "4h", "1d"] as Timeframe[],
          }))
          .sort((a, b) => {
            const aFav = favSet.has(a.label) ? 0 : 1;
            const bFav = favSet.has(b.label) ? 0 : 1;
            if (aFav !== bFav) return aFav - bFav;
            return a.label.localeCompare(b.label);
          });
        setExtraAssets(extras);
        log(`${extras.length} pares USDT extra cargados (premium)`);
      })
      .catch((e) => {
        log(`ERROR Binance exchangeInfo: ${e.message}`);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnon]);

  // Load history on mount
  useEffect(() => {
    fetch("/api/kronos/history")
      .then((r) => r.json())
      .then((d) => setHistory(d.items ?? []))
      .catch(() => {});
  }, [savedId]);

  // Load status (enabled + remaining) — always
  useEffect(() => {
    fetch("/api/kronos/predict/status")
      .then((r) => r.json())
      .then((d: StatusInfo) => {
        setStatusInfo(d);
        setOffline(!d.enabled);
      })
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

  const loadCandles = useCallback(async (asset: AssetMeta, tf: Timeframe) => {
    setStatus("loading-candles");
    setError(null);
    setPredicted([]);
    setSavedId(null);
    const qs = asset.id.startsWith("bnb-")
      ? `bnb=${encodeURIComponent(asset.symbol)}&tf=${tf}&limit=512`
      : `id=${asset.id}&tf=${tf}&limit=512`;
    log(`GET /api/kronos/candles?${qs}  (source=${asset.source})`);
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/kronos/candles?${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }
      const payload = (await res.json()) as { candles: Candle[] };
      const data = payload.candles;
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      if (data.length === 0) throw new Error("Proveedor devolvió 0 velas");
      setCandles(data);
      const first = new Date(data[0].time * 1000);
      const last = new Date(data[data.length - 1].time * 1000);
      log(`← ${data.length} velas (${elapsed}s) | ${first.toLocaleDateString("es-ES")} ${first.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} → ${last.toLocaleDateString("es-ES")} ${last.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`);
      log(`Rango de precio: ${Math.min(...data.map(c=>c.low)).toLocaleString("es-ES", {maximumFractionDigits:2})} — ${Math.max(...data.map(c=>c.high)).toLocaleString("es-ES", {maximumFractionDigits:2})}`);
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
    loadCandles(currentAsset, timeframe);
  }, [currentAsset, timeframe, loadCandles]);

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

  async function handlePredict() {
    if (candles.length === 0) return;
    setStatus("predicting");
    setError(null);
    setPredicted([]);
    setSavedId(null);

    // Snapshot config — if user changes asset/tf/model mid-flight we discard the result
    const reqAssetId = assetId;
    const reqTimeframe = timeframe;
    const reqModel = model;

    const lastCandle = candles[candles.length - 1];
    const lastPrice = lastCandle.close;

    log(`────── predict() ──────`);
    log(`Asset: ${currentAsset.label} (${currentAsset.sublabel ?? currentAsset.symbol}) · ${currentAsset.source}`);
    log(`Timeframe: ${timeframe} (${getTimeframeLabel(timeframe)})`);
    const modelInfo = KRONOS_MODELS.find((m) => m.id === model);
    if (!modelInfo) {
      setError("Modelo no válido.");
      setStatus("error");
      return;
    }
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

      // Drift guard — user changed asset/tf/model mid-flight; discard
      if (reqAssetId !== assetId || reqTimeframe !== timeframe || reqModel !== model) {
        log(`(resultado descartado — cambiaste de activo/TF/modelo)`);
        if (reqAssetId === assetId && reqTimeframe === timeframe) {
          setStatus("idle");
        }
        return;
      }

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const predCandles = resultToCandles(result);

      if (isAnon) {
        // Refresh remaining counter after successful prediction
        fetch("/api/kronos/predict/status")
          .then((r) => r.json())
          .then((d: StatusInfo) => setStatusInfo(d))
          .catch(() => {});
      }

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

      if (/KRONOS_OFFLINE/i.test(msg) || /Kronos está temporalmente offline|no responde/i.test(msg)) {
        setOffline(true);
        setError("Kronos está temporalmente offline. Vuelve a intentarlo en unos momentos.");
      } else if (/RATE_LIMITED/i.test(msg) || /3 predicciones/i.test(msg)) {
        setError("Has usado tus 3 predicciones de hoy. Regístrate gratis para seguir.");
        if (isAnon) {
          // Force remaining to 0
          setStatusInfo((prev) => prev ? { ...prev, remaining: 0 } : prev);
        }
      } else {
        setError(friendlyError(msg));
      }
      setStatus("error");
    }
  }

  async function handleSave() {
    if (predicted.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/kronos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: currentAsset.symbol,
          timeframe,
          model,
          source: currentAsset.source,
          assetLabel: currentAsset.label,
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
      } else {
        log(`ERROR al guardar (HTTP ${res.status}): ${data.error ?? data.message ?? "respuesta sin id"}`);
      }
    } catch (e) {
      log(`ERROR al guardar: ${e instanceof Error ? e.message : "desconocido"}`);
    } finally {
      setSaving(false);
    }
  }

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
            <span className={styles.assetName}>{currentAsset.label}</span>
            {currentAsset.sublabel && (
              <span className={styles.assetSub}>{currentAsset.sublabel}</span>
            )}
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
              <div className={styles.assetCats}>
                {(["all","crypto","stock","index","forex","commodity"] as const).map((c) => (
                  <button
                    key={c}
                    className={`${styles.assetCatBtn} ${categoryFilter === c ? styles.assetCatBtnActive : ""}`}
                    onClick={() => setCategoryFilter(c)}
                  >
                    {c === "all" ? "Todo" : categoryLabel(c)}
                  </button>
                ))}
              </div>
              <div className={styles.assetList} role="listbox">
                {(() => {
                  const q = search.trim().toLowerCase();
                  const filtered = allAssets.filter((a) => {
                    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
                    if (!q) return true;
                    return (
                      a.label.toLowerCase().includes(q) ||
                      a.symbol.toLowerCase().includes(q) ||
                      (a.sublabel?.toLowerCase().includes(q) ?? false)
                    );
                  });
                  // Free first, then premium (preserving within-group order)
                  const free = filtered.filter((a) => a.tier === "free");
                  const premium = filtered.filter((a) => a.tier === "premium");
                  const ordered = [...free, ...premium];
                  if (ordered.length === 0) {
                    return <span className={styles.assetEmpty}>Sin resultados</span>;
                  }
                  return ordered.map((a) => {
                    const locked = isAnon && a.tier === "premium";
                    const tdDown = !!statusInfo?.twelveDataBlocked && a.source === "twelvedata";
                    const isActive = a.id === assetId;
                    const inner = (
                      <>
                        <span className={styles.assetOptionLabel}>{a.label}</span>
                        {a.sublabel && (
                          <span className={styles.assetOptionSub}>{a.sublabel}</span>
                        )}
                        {tdDown && (
                          <span className={styles.assetOptionDown} title="Datos temporalmente no disponibles" aria-hidden="true">
                            offline
                          </span>
                        )}
                        {!tdDown && a.tier === "premium" && (
                          <span className={styles.assetOptionBadge} aria-hidden="true">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l2.8 6.3 6.9.6-5.2 4.7 1.6 6.8L12 16.9 5.9 20.4l1.6-6.8L2.3 8.9l6.9-.6L12 2z" />
                            </svg>
                            Premium
                          </span>
                        )}
                      </>
                    );
                    if (locked) {
                      return (
                        <Link
                          key={a.id}
                          href="/suscribirse"
                          className={`${styles.assetOption} ${styles.assetOptionLocked}`}
                          aria-label={`${a.label} — suscríbete para acceder`}
                        >
                          {inner}
                        </Link>
                      );
                    }
                    if (tdDown) {
                      return (
                        <button
                          key={a.id}
                          disabled
                          className={`${styles.assetOption} ${styles.assetOptionDisabled}`}
                          aria-label={`${a.label} — datos temporalmente no disponibles`}
                        >
                          {inner}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={a.id}
                        role="option"
                        aria-selected={isActive}
                        className={`${styles.assetOption} ${isActive ? styles.assetOptionActive : ""}`}
                        onClick={() => {
                          setAssetId(a.id);
                          setSearch("");
                          setAssetOpen(false);
                        }}
                      >
                        {inner}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Timeframe */}
        <div className={styles.tfGroup}>
          {currentAsset.timeframes.map((tf) => (
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
            {KRONOS_MODELS.map((m) => {
              const locked = isAnon && m.id !== "mini";
              if (locked) {
                return (
                  <Link
                    key={m.id}
                    href="/suscribirse"
                    className={`${styles.modelBtn} ${styles.modelBtnLocked}`}
                    onMouseEnter={() => setHoveredModel(m.id)}
                    onMouseLeave={() => setHoveredModel(null)}
                    aria-label={`${m.label} — modelo premium`}
                  >
                    <ModelIcon model={m.id} />
                    <span className={styles.modelLabel}>{m.label}</span>
                    <svg
                      className={styles.modelLock}
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                    <span className={styles.modelPremiumBadge} aria-hidden="true">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l2.8 6.3 6.9.6-5.2 4.7 1.6 6.8L12 16.9 5.9 20.4l1.6-6.8L2.3 8.9l6.9-.6L12 2z" />
                      </svg>
                      Premium
                    </span>
                  </Link>
                );
              }
              return (
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
              );
            })}
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
          {isAnon && statusInfo && statusInfo.remaining !== null && (
            <span
              className={styles.anonCounter}
              title="Predicciones gratuitas disponibles hoy"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.3 21 12 17.5 5.7 21 7.2 14 2 9.3 8.9 8.6 12 2" />
              </svg>
              <span>
                <strong>{statusInfo.remaining}</strong>
                <span className={styles.anonCounterSlash}>/</span>
                {statusInfo.max ?? 3} gratis hoy
              </span>
            </span>
          )}
          {(() => {
            const disabled =
              status === "predicting" ||
              status === "loading-candles" ||
              candles.length === 0 ||
              offline ||
              (isAnon && statusInfo?.remaining === 0);
            const ready =
              !disabled &&
              predicted.length === 0 &&
              candles.length > 0;
            return (
          <button
            className={`${styles.predictBtn} ${ready ? styles.predictBtnReady : ""}`}
            onClick={handlePredict}
            disabled={disabled}
          >
            {status === "predicting" ? (
              <>
                <span className={styles.predictSpinner} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2a10 10 0 1 0 10 10" />
                  </svg>
                </span>
                <span className={styles.predictLoadingText}>
                  Prediciendo
                  <span className={styles.predictDots} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
                <span className={styles.predictElapsed} aria-live="polite">
                  {predictElapsed.toFixed(1)}s
                </span>
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
            {status === "predicting" && <span className={styles.predictProgress} aria-hidden="true" />}
          </button>
            );
          })()}

          {predicted.length > 0 && (
            <button
              className={`${styles.saveBtn} ${savedId ? styles.saveBtnDone : ""}`}
              onClick={() => {
                if (!saveOpen && !saveComment) {
                  setSaveComment(buildDefaultComment(currentAsset, timeframe, model, candles, predicted));
                }
                setSaveOpen(!saveOpen);
              }}
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

      {/* ── Offline banner ── */}
      {offline && (
        <div className={styles.offlineBanner} role="status" aria-live="polite">
          <span className={styles.offlineDot} aria-hidden="true" />
          <span className={styles.offlineText}>
            {statusInfo?.reason === "global_cap" ? (
              <>
                Kronos ha alcanzado el <strong>límite de uso de hoy</strong> para proteger los créditos de inferencia.{" "}
                {statusInfo.globalResetsAt
                  ? `Volverá disponible a las ${new Date(statusInfo.globalResetsAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}.`
                  : "Vuelve mañana."}{" "}
                {isAnon && (
                  <>
                    Mientras tanto, <Link href="/" className={styles.offlineLink}>explora Chamillion</Link>.
                  </>
                )}
              </>
            ) : (
              <>
                Kronos está temporalmente offline.{" "}
                {isAnon ? (
                  <>Mientras tanto, <Link href="/" className={styles.offlineLink}>explora Chamillion</Link>.</>
                ) : (
                  <>Vuelve a intentarlo en unos momentos.</>
                )}
              </>
            )}
          </span>
        </div>
      )}

      {/* ── Rate limit banner (anon only) ── */}
      {isAnon && statusInfo?.remaining === 0 && !offline && (
        <div className={styles.rateLimitBanner}>
          <span className={styles.rateLimitText}>
            Has agotado tus predicciones gratuitas de hoy.
          </span>
          <Link href="/suscribirse" className={styles.rateLimitCta}>
            Regístrate gratis
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      )}

      {/* ── Status/Error ── */}
      {status === "loading-candles" && (
        <div className={styles.statusBar} role="status" aria-live="polite">
          <span className={styles.spinner} /> Cargando velas...
        </div>
      )}
      {error && (
        <div className={styles.errorBar} role="alert" aria-live="assertive">
          <span className={styles.errorText}>{error}</span>
          <button
            className={styles.retryBtn}
            onClick={() => {
              if (status === "error" && candles.length === 0) {
                loadCandles(currentAsset, timeframe);
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
        <div className={`${styles.terminal} ${styles.terminalSide}`}>
          <div className={styles.terminalHeader}>
            <span className={styles.terminalTitle}>Log</span>
            {logs.length > 0 && (
              <button className={styles.terminalClear} onClick={() => setLogs([])}>
                Limpiar
              </button>
            )}
          </div>
          <div ref={logRef} className={styles.terminalBody}>
            {logs.length === 0 ? (
              <div className={styles.terminalEmpty}>Log vacío</div>
            ) : (
              logs.map((line, i) => (
                <div
                  key={i}
                  className={`${styles.terminalLine} ${line.includes("ERROR") ? styles.terminalError : ""} ${line.includes("──") ? styles.terminalSeparator : ""}`}
                >
                  {line}
                </div>
              ))
            )}
            {status === "predicting" && (
              <div className={`${styles.terminalLine} ${styles.terminalWaitLine}`}>
                <span className={styles.terminalWaitDot} aria-hidden="true" />
                <span className={styles.terminalWaitMsg}>
                  {predictElapsed < 5
                    ? "waiting for modal.run response"
                    : predictElapsed < 15
                      ? "cold start en GPU (T4) — cargando modelo"
                      : predictElapsed < 30
                        ? "ejecutando inferencia — forward pass"
                        : "aún trabajando — cold start puede tardar hasta 60s"}
                </span>
                <span className={styles.terminalWaitTicks} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles.terminalWaitClock}>
                  {predictElapsed.toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        </div>
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

      {/* ── Saved link (share) ── */}
      {savedId && (
        <div className={styles.savedLink}>
          <span className={styles.savedLinkLabel}>Predicción guardada</span>
          <Link href={`/kronos/p/${savedId}`} className={styles.savedLinkAnchor}>
            Ver y compartir
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      )}

      {/* ── Save dialog (modal) ── */}
      {saveOpen && (
        <div
          className={styles.saveBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaveOpen(false);
          }}
        >
          <div className={styles.saveDialog}>
            <div className={styles.saveHeader}>
              <span id="save-dialog-title">Guardar predicción</span>
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
              placeholder="Email (opcional)"
              value={saveEmail}
              onChange={(e) => setSaveEmail(e.target.value)}
            />
            <textarea
              className={styles.saveTextarea}
              placeholder="Comentario (opcional): ¿qué ves? ¿qué esperas?"
              value={saveComment}
              onChange={(e) => setSaveComment(e.target.value)}
              rows={3}
            />
            <button
              className={styles.savePrimary}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar predicción"}
            </button>
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
            {history.map((h) => {
              const inProgress = new Date(h.pred_range_end).getTime() > Date.now();
              return (
                <div key={h.id} className={styles.historyRow}>
                  <Link href={`/kronos/p/${h.id}`} className={styles.historyItem}>
                    <span
                      className={`${styles.historyStatus} ${inProgress ? styles.historyStatusLive : styles.historyStatusDone}`}
                      title={inProgress ? "En progreso — aún dentro del rango predicho" : "Finalizada — el rango predicho ya pasó"}
                      aria-label={inProgress ? "En progreso" : "Finalizada"}
                    />
                    <span className={styles.historyAsset}>{formatHistorySymbol(h.symbol)}</span>
                    <span className={styles.historyTf}>{h.timeframe}</span>
                    {h.model && <span className={styles.historyModel}>{h.model}</span>}
                    {h.comment && <span className={styles.historyComment}>&ldquo;{h.comment}&rdquo;</span>}
                    <span className={styles.historyDate}>
                      {new Date(h.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </Link>
                  {isAdmin && (
                    <button
                      type="button"
                      className={styles.historyDelete}
                      onClick={async () => {
                        if (!confirm(`¿Eliminar predicción ${h.symbol} (${h.timeframe})?`)) return;
                        const res = await fetch("/api/kronos/delete", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: h.id }),
                        });
                        if (res.ok) {
                          setHistory((prev) => prev.filter((x) => x.id !== h.id));
                        }
                      }}
                      title="Borrar (admin)"
                      aria-label="Borrar predicción"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* ── Chamillion CTA (public demo only) ── */}
      {isAnon && (
      <Link href="/" className={styles.chamillionCta}>
        <span className={styles.chamillionLogo} aria-hidden="true">
          <Image
            src="/assets/newsletter/logo.jpg"
            alt=""
            width={48}
            height={48}
            sizes="48px"
          />
        </span>
        <span className={styles.chamillionBody}>
          <span className={styles.chamillionKicker}>
            <span className={styles.chamillionDot} />
            Chamillion
          </span>
          <span className={styles.chamillionTitle}>
            Documentando la vanguardia de los mercados financieros.
          </span>
          <span className={styles.chamillionSubtext}>
            <em>Con un ojo en cada pantalla.</em>
          </span>
          <span className={styles.chamillionAction}>
            <span className={styles.chamillionActionText}>Descubrir</span>
            <svg className={styles.chamillionArrow} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </span>
        </span>
        <span className={styles.chamillionCover} aria-hidden="true">
          <Image
            src="https://3hkzsfmnwdimbdxj.public.blob.vercel-storage.com/newsletter/banner-post-01-XRge08UEXKueBFhB7eTjVfOSEvg9Ma.jpeg"
            alt=""
            fill
            sizes="180px"
          />
        </span>
      </Link>
      )}

      {/* ── Disclaimer (muted legal note) ── */}
      <p className={styles.disclaimer}>
        No es consejo financiero. Kronos es un experimento de modelado. Las predicciones pueden ser inexactas, sesgadas o equivocadas.
      </p>
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


