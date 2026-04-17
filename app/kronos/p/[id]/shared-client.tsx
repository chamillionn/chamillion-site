"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Candle, Timeframe } from "@/lib/binance";
import { getTimeframeLabel } from "@/lib/binance";
import { computeAllMetrics } from "@/lib/kronos-metrics";
import styles from "./shared.module.css";

interface PredictionMeta {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  model: string;
  comment: string | null;
  createdAt: string;
}

interface Props {
  prediction: PredictionMeta;
  inputCandles: Candle[];
  predictedCandles: Candle[];
  actualCandles: Candle[];
}

export default function SharedClient({
  prediction,
  inputCandles,
  predictedCandles,
  actualCandles,
}: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Console easter egg for curious devs peeking at the page
  useEffect(() => {
    console.log(
      "%cKronos%c\n%cEsta predicción está congelada en el tiempo. Las velas reales se van dibujando encima conforme pasa el mercado.\n\nEl análisis detrás: https://chamillion.substack.com",
      "color:#6B8EA0;font-weight:700;font-size:20px;font-family:serif;",
      "",
      "color:#8B9099;font-size:11px;line-height:1.6;",
    );
  }, []);

  const base = prediction.symbol.replace("USDT", "");
  const lastKnownClose = inputCandles[inputCandles.length - 1]?.close ?? 0;

  const metrics = actualCandles.length > 0
    ? computeAllMetrics(predictedCandles, actualCandles, lastKnownClose)
    : null;

  // Render chart
  useEffect(() => {
    if (!chartRef.current || inputCandles.length === 0) return;

    let disposed = false;

    (async () => {
      const { createChart, ColorType, CandlestickSeries } = await import("lightweight-charts");

      if (disposed || !chartRef.current) return;

      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 460,
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

      // Historical (input) candles
      const histSeries = chart.addSeries(CandlestickSeries, {
        upColor: isDark ? "#5BAA7C" : "#2a7348",
        downColor: isDark ? "#C7555A" : "#a8333a",
        borderUpColor: isDark ? "#5BAA7C" : "#2a7348",
        borderDownColor: isDark ? "#C7555A" : "#a8333a",
        wickUpColor: isDark ? "#5BAA7C80" : "#2a734880",
        wickDownColor: isDark ? "#C7555A80" : "#a8333a80",
      });
      histSeries.setData(inputCandles.map((c) => ({
        time: c.time as import("lightweight-charts").UTCTimestamp,
        open: c.open, high: c.high, low: c.low, close: c.close,
      })));

      // Predicted candles (steel-blue)
      const predSeries = chart.addSeries(CandlestickSeries, {
        upColor: isDark ? "#6B8EA0" : "#2b5d73",
        downColor: isDark ? "#4A6E80" : "#1e4a5c",
        borderUpColor: isDark ? "#6B8EA0" : "#2b5d73",
        borderDownColor: isDark ? "#4A6E80" : "#1e4a5c",
        wickUpColor: isDark ? "#6B8EA080" : "#2b5d7380",
        wickDownColor: isDark ? "#4A6E8080" : "#1e4a5c80",
      });
      predSeries.setData(predictedCandles.map((c) => ({
        time: c.time as import("lightweight-charts").UTCTimestamp,
        open: c.open, high: c.high, low: c.low, close: c.close,
      })));

      // Actual candles (gold tones, very distinct)
      if (actualCandles.length > 0) {
        const actualSeries = chart.addSeries(CandlestickSeries, {
          upColor: isDark ? "#C9A84C" : "#8a7020",
          downColor: isDark ? "#8A7020" : "#5a4a10",
          borderUpColor: isDark ? "#C9A84C" : "#8a7020",
          borderDownColor: isDark ? "#8A7020" : "#5a4a10",
          wickUpColor: isDark ? "#C9A84C80" : "#8a702080",
          wickDownColor: isDark ? "#8A702080" : "#5a4a1080",
        });
        actualSeries.setData(actualCandles.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          open: c.open, high: c.high, low: c.low, close: c.close,
        })));
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
  }, [inputCandles, predictedCandles, actualCandles, isDark]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tweetText = encodeURIComponent(
    `Predicción Kronos para ${base}/USDT (${getTimeframeLabel(prediction.timeframe)}) — ${prediction.comment ? `"${prediction.comment}"` : "ver resultado"}`,
  );
  const tweetUrl = typeof window !== "undefined"
    ? `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(window.location.href)}`
    : "#";

  const createdDate = new Date(prediction.createdAt).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.brandBar}>
            <Link href="/" className={styles.brand}>Chamillion</Link>
            <span className={styles.brandDivider}>/</span>
            <span className={styles.brandTool}>
              <Image src="/kronos/logo.svg" alt="" width={16} height={16} />
              Kronos
            </span>
          </div>
          <h1 className={styles.title}>
            <span className={styles.titleAsset}>{base}/USDT</span>
            <span className={styles.titleSep}>·</span>
            <span className={styles.titleTf}>{getTimeframeLabel(prediction.timeframe)}</span>
          </h1>
          {prediction.comment && (
            <p className={styles.comment}>&ldquo;{prediction.comment}&rdquo;</p>
          )}
          <p className={styles.meta}>Predicción generada el {createdDate}</p>
        </header>

        {/* ── Chart ── */}
        <div className={styles.chartWrap}>
          <div ref={chartRef} className={styles.chart} />
        </div>

        {/* ── Legend ── */}
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.dotHist} />
            Histórico
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dotPred} />
            Predicción Kronos
          </span>
          {actualCandles.length > 0 && (
            <span className={styles.legendItem}>
              <span className={styles.dotActual} />
              Realidad
            </span>
          )}
        </div>

        {/* ── Metrics ── */}
        {metrics ? (
          <section className={styles.metrics}>
            <div className={styles.metricsHeader}>
              <span className={styles.metricsTitle}>Precisión vs realidad</span>
              <span className={styles.metricsProgress}>
                {metrics.candlesCompared}/{metrics.candlesExpected} velas ({(metrics.progressPct * 100).toFixed(0)}%)
              </span>
            </div>
            <div className={styles.metricsGrid}>
              <Metric
                label="MAE"
                value={metrics.mae != null ? `$${metrics.mae.toLocaleString("es-ES", { maximumFractionDigits: 2 })}` : "—"}
                hint="Error absoluto medio"
              />
              <Metric
                label="MAPE"
                value={metrics.mape != null ? `${(metrics.mape * 100).toFixed(2)}%` : "—"}
                hint="Error porcentual medio"
              />
              <Metric
                label="Dirección"
                value={metrics.directional != null ? `${(metrics.directional * 100).toFixed(0)}%` : "—"}
                hint="Acierto up/down"
                highlight={metrics.directional != null && metrics.directional >= 0.5}
              />
              <Metric
                label="Rango"
                value={metrics.rangeHit != null ? `${(metrics.rangeHit * 100).toFixed(0)}%` : "—"}
                hint="Close dentro de [low, high] predichos"
                highlight={metrics.rangeHit != null && metrics.rangeHit >= 0.5}
              />
            </div>
          </section>
        ) : (
          <section className={styles.waiting}>
            <div className={styles.waitingDot} />
            <span>Esperando datos reales — la predicción cubre un periodo futuro que aún no ha sucedido.</span>
          </section>
        )}

        {/* ── Share ── */}
        <div className={styles.shareRow}>
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
            Tweet
          </a>
          <button className={styles.shareBtn} onClick={copyLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>

        {/* ── Footer info + credits ── */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div>
              <div className={styles.footerLabel}>¿Qué es Kronos?</div>
              <p className={styles.footerText}>
                Transformer entrenado en series OHLCV de mercados cripto. Recibe 512 velas de
                contexto y predice 24 hacia adelante. No es consejo financiero — es una forma
                de ver qué <em>cree</em> un modelo que va a pasar.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/hub/herramientas/kronos" className={styles.footerLink}>
                Prueba Kronos →
              </Link>
            </div>
          </div>
          <div className={styles.credits}>
            <span className={styles.creditsLabel}>Créditos</span>
            <span>
              Modelo{" "}
              <a
                href={`https://huggingface.co/NeoQuasar/Kronos-${prediction.model}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.creditLink}
              >
                NeoQuasar/Kronos-{prediction.model}
              </a>
              {" "}·{" "}
              Código{" "}
              <a
                href="https://github.com/shiyu-coder/Kronos"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.creditLink}
              >
                shiyu-coder/Kronos
              </a>
              {" "}(MIT) · Datos{" "}
              <a
                href="https://www.binance.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.creditLink}
              >
                Binance
              </a>
            </span>
          </div>
        </footer>

        {/* ── Chamillion CTA ── */}
        <Link href="/" className={styles.chamillionCta}>
          <span className={styles.chamillionLogo} aria-hidden="true">
            <Image
              src="/assets/newsletter/logo.jpg"
              alt=""
              width={52}
              height={52}
              sizes="52px"
            />
          </span>
          <span className={styles.chamillionBody}>
            <span className={styles.chamillionKicker}>
              <span className={styles.chamillionDot} />
              Chamillion · Estudio
            </span>
            <span className={styles.chamillionTitle}>
              Documentando la vanguardia de los mercados.
            </span>
            <span className={styles.chamillionSubtext}>
              Cartera verificable en tiempo real, newsletter, herramientas como Kronos. <em>Con un ojo en cada pantalla.</em>
            </span>
            <span className={styles.chamillionAction}>
              <span className={styles.chamillionActionText}>Descubrir Chamillion</span>
              <svg className={styles.chamillionArrow} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </span>
          </span>
          <span className={styles.chamillionCover} aria-hidden="true">
            <Image
              src="/assets/newsletter/banner-post-01.jpeg"
              alt=""
              fill
              sizes="240px"
            />
          </span>
        </Link>

        {/* ── Disclaimer (muted legal note) ── */}
        <p className={styles.disclaimer}>
          No es consejo financiero. Kronos es un experimento de modelado. Las predicciones pueden ser inexactas, sesgadas o equivocadas.
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue} ${highlight ? styles.metricValueGood : ""}`}>
        {value}
      </span>
      <span className={styles.metricHint}>{hint}</span>
    </div>
  );
}
