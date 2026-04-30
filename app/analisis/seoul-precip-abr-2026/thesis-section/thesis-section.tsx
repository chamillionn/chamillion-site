import type { ForecastSnapshot } from "@/lib/supabase/types";
import {
  DETERMINISTIC_FORECASTS,
  FORECAST_DAYS,
  ENSEMBLE_STATS,
  GFS_ENSEMBLE_TOTALS,
  ENSO_STATE,
  MARKET_RULES,
  SCENARIOS,
  CURRENT_STATE,
} from "../data";
import styles from "./thesis-section.module.css";

interface Props {
  forecasts?: ForecastSnapshot | null;
}

export default function ThesisSection({ forecasts }: Props) {
  return (
    <div className={styles.section}>
      <ModelForecastsBlock forecasts={forecasts} />
      <EnsembleBlock forecasts={forecasts} />
      <ScenariosBlock />
      <EnsoBlock />
      <MarketRulesBlock />
    </div>
  );
}

function ModelForecastsBlock({ forecasts }: { forecasts?: ForecastSnapshot | null }) {
  const need = CURRENT_STATE.needToCross;
  const models = forecasts?.deterministic ?? DETERMINISTIC_FORECASTS;
  const days = forecasts?.forecastDays ?? FORECAST_DAYS;
  const isLive = !!forecasts?.fetchedAt;
  const asOf = isLive
    ? new Date(forecasts!.fetchedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "snapshot 23 abr";

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>Modelos deterministas</span>
        <span className={styles.blockNote}>{isLive ? `live · ${asOf}` : asOf} · necesario ≥{need}mm</span>
      </div>
      <table className={styles.modelTable}>
        <thead>
          <tr>
            <th>Modelo</th>
            {days.map((d) => (
              <th key={d}>{typeof d === "string" && d.length === 10 ? d.slice(8) : String(d).slice(0, 2)}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => {
            const exceedNeeded = m.total >= need;
            const totalClass = exceedNeeded ? styles.totalCellWarn : styles.totalCellGood;
            return (
              <tr key={m.slug}>
                <td>
                  {m.model}
                  {m.note && <span className={styles.modelNote}>{m.note}</span>}
                  {isLive && !("ok" in m && m.ok) && <span className={styles.modelNote}> · sin datos</span>}
                </td>
                {m.daily.map((v, i) => (
                  <td key={i} className={v === 0 ? styles.cellZero : undefined}>
                    {v === 0 ? "0" : v.toFixed(1)}
                  </td>
                ))}
                <td className={`${styles.totalCell} ${totalClass}`}>
                  {m.total.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EnsembleBlock({ forecasts }: { forecasts?: ForecastSnapshot | null }) {
  const liveEns = forecasts?.ensemble;
  const memberTotals = [...(liveEns?.memberTotals ?? GFS_ENSEMBLE_TOTALS)].sort((a, b) => a - b);
  const count = liveEns?.count ?? ENSEMBLE_STATS.count;
  const meanVal = liveEns?.mean ?? ENSEMBLE_STATS.mean;
  const medianVal = liveEns?.median ?? ENSEMBLE_STATS.median;
  const need = CURRENT_STATE.needToCross;
  const crossingCount = memberTotals.filter((v) => v >= need).length;
  const probBelow = count > 0 ? (count - crossingCount) / count : ENSEMBLE_STATS.probUnder40;
  const maxOutlier = memberTotals.length > 0 ? Math.max(...memberTotals) : ENSEMBLE_STATS.maxOutlier;
  const probStr = `${Math.round(probBelow * 100)}%`;
  const isLive = !!liveEns;

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>GFS Ensemble · {count} miembros</span>
        <span className={styles.blockNote}>{isLive ? "live · " : "snapshot · "}prob &lt;40mm = {probStr}</span>
      </div>

      <div className={styles.ensembleRow}>
        <div className={styles.stat}>
          <span className={styles.statKey}>Prob &lt;40mm</span>
          <span className={`${styles.statVal} ${styles.statValGood}`}>{probStr}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Miembros cruzan</span>
          <span className={`${styles.statVal} ${styles.statValMuted}`}>{crossingCount}/{count}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Media</span>
          <span className={`${styles.statVal} ${styles.statValMuted}`}>{meanVal.toFixed(1)}mm</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Mediana</span>
          <span className={`${styles.statVal} ${styles.statValMuted}`}>{medianVal.toFixed(1)}mm</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statKey}>Outlier máx</span>
          <span className={`${styles.statVal} ${styles.statValMuted}`}>{maxOutlier.toFixed(1)}mm</span>
        </div>
      </div>

      <div className={styles.dotGrid} aria-label="Distribución del ensemble">
        {memberTotals.map((total, i) => (
          <div
            key={i}
            className={`${styles.dot} ${total >= need ? styles.dotAbove : styles.dotBelow}`}
            title={`M${i + 1}: ${total.toFixed(1)}mm`}
          />
        ))}
      </div>
    </div>
  );
}

function ScenariosBlock() {
  const maxEv = Math.max(...SCENARIOS.map((s) => {
    const totalPnl = s.legPnl.reduce((a, b) => a + b, 0);
    return Math.abs(totalPnl);
  }));

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>Escenarios · payoff</span>
      </div>
      <div className={styles.scenarios}>
        {SCENARIOS.map((s) => {
          const total = s.legPnl.reduce((a, b) => a + b, 0);
          const ev = total * s.probability;
          const evClass =
            ev > 0 ? styles.scenEvPos : ev < 0 ? styles.scenEvNeg : styles.scenEvZero;
          const barWidth = (Math.abs(total) / maxEv) * 100;

          return (
            <div key={s.label} className={styles.scenarioRow}>
              <span className={styles.scenLabel}>{s.label}</span>
              <span className={styles.scenProb}>{(s.probability * 100).toFixed(0)}%</span>
              <div
                className={styles.scenBar}
                style={{ width: `${barWidth}%` }}
                aria-hidden="true"
              />
              <span className={`${styles.scenEv} ${evClass}`}>
                {ev >= 0 ? "+" : ""}
                {ev.toFixed(0)}$
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EnsoBlock() {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>Contexto ENSO</span>
        <span className={styles.blockNote}>{ENSO_STATE.source.name}</span>
      </div>
      <div className={styles.kvList}>
        <span className={styles.kvKey}>Estado actual</span>
        <span className={styles.kvVal}>{ENSO_STATE.current}</span>

        <span className={styles.kvKey}>Outlook</span>
        <span className={styles.kvVal}>{ENSO_STATE.outlook}</span>

        <span className={styles.kvKey}>Relevancia abril Korea</span>
        <span className={styles.kvVal}>{ENSO_STATE.implicationsAprilKorea}</span>
      </div>
    </div>
  );
}

function MarketRulesBlock() {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>Resolución del mercado</span>
      </div>
      <div className={styles.kvList}>
        <span className={styles.kvKey}>Fuente</span>
        <span className={styles.kvVal}>{MARKET_RULES.source}</span>

        <span className={styles.kvKey}>Precisión</span>
        <span className={styles.kvVal}>{MARKET_RULES.precision}</span>

        <span className={styles.kvKey}>Empate</span>
        <span className={styles.kvVal}>{MARKET_RULES.tieBreak}</span>

        <span className={styles.kvKey}>Cierre</span>
        <span className={styles.kvVal}>{MARKET_RULES.cutoff}</span>

        <span className={styles.kvKey}>Revisiones</span>
        <span className={styles.kvVal}>{MARKET_RULES.revisions}</span>
      </div>
    </div>
  );
}
