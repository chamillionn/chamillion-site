import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import {
  getAnalysisForDetail,
  listObservations,
  latestSnapshot,
  listEvents,
} from "@/lib/supabase/analyses-client";
import PaywallCTA from "@/components/paywall-cta";

// Shared UI atoms
import Callout from "@/components/analisis/callout";
import Term from "@/components/analisis/term";
import Source from "@/components/analisis/source";
import LiveTrackerV2 from "@/components/analisis/live-tracker-v2";
import AdminTickButton from "@/components/analisis/admin-tick-button";

// Seoul-specific
import Hero from "./hero";
import AnalysisNav, { type NavSection } from "./nav";
import Section from "./section";
import MarketTable from "./market-table";
import PolymarketEmbed from "./polymarket-embed";
import PastSection from "./past-section";
import ForecastTable from "./forecast-table";
import EnsembleSpaghetti from "./ensemble-spaghetti";
import EnsembleHistogram from "./ensemble-histogram";
import EnsembleVsMarket from "./ensemble-vs-market";
import EVCalculator from "./ev-calculator";
import PositionCalculator from "./position-calculator";

import {
  CURRENT_STATE,
  MARKET_BUCKETS,
  DETERMINISTIC_FORECASTS,
  FORECAST_DAYS,
  GFS_ENSEMBLE_TOTALS,
  GFS_ENSEMBLE_CUMULATIVE,
  POSITIONS,
  SOURCES,
  POLYMARKET_EVENT,
  KMA_SOURCE_URL,
  SEOUL_ANALYSIS_SNAPSHOT_DATE,
} from "./data";

import styles from "./page.module.css";

const SLUG = "seoul-precip-abr-2026";
export const revalidate = 3600;

const SECTIONS: NavSection[] = [
  { id: "seguimiento", label: "Seguimiento" },
  { id: "pasado", label: "Pasado" },
  { id: "futuro", label: "Futuro" },
  { id: "ineficiencia", label: "Ineficiencia y EV" },
  { id: "posicion", label: "La posición" },
  { id: "riesgos", label: "Riesgos" },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: POLYMARKET_EVENT.title,
    description:
      "Análisis en profundidad del mercado Polymarket sobre la precipitación mensual en Seúl. Seguimiento en vivo, comparación de modelos, ineficiencia de pricing y posición con calculadora de ganancias.",
    alternates: { canonical: `https://chamillion.site/analisis/${SLUG}` },
  };
}

const scenarios = [
  { key: "<40", label: "Final <40 mm", probability: 0.77 },
  { key: "40-50", label: "Final 40-50 mm", probability: 0.17 },
  { key: "50-55", label: "Final 50-55 mm", probability: 0.01 },
  { key: "55-60", label: "Final 55-60 mm", probability: 0.01 },
  { key: "60+", label: "Final ≥60 mm", probability: 0.04 },
];

const ALL_SCENARIO_KEYS = ["<40", "40-50", "50-55", "55-60", "60+"];

/**
 * Produce a minimal snapshot from the fallback sources (observations table +
 * hardcoded baseline). The tracker cron will overwrite this once it runs —
 * meanwhile the UI has something to render.
 */
function buildFallbackSnapshot(
  analysis: import("@/lib/supabase/types").Analysis | import("@/lib/supabase/types").AnalysisPublic,
  currentValue: number,
  sourceLabel: string,
): import("@/lib/supabase/types").AnalysisSnapshot {
  return {
    id: "fallback",
    analysis_id: analysis.id,
    snapshot_date: new Date().toISOString().slice(0, 10),
    underlying: {
      value: currentValue,
      unit: analysis.prediction_unit ?? "",
      source: sourceLabel,
      asOf: new Date().toISOString(),
    },
    position: null,
    edge: null,
    created_at: new Date().toISOString(),
  };
}

const positionLegs = [
  {
    name: "<40 YES",
    subtitle: `$${POSITIONS[0].price.toFixed(2)} en Polymarket`,
    side: "yes" as const,
    price: POSITIONS[0].price,
    winsOn: ["<40"],
  },
  {
    name: "50-55 NO",
    subtitle: `$${POSITIONS[1].price.toFixed(2)}`,
    side: "no" as const,
    price: POSITIONS[1].price,
    winsOn: ALL_SCENARIO_KEYS.filter((k) => k !== "50-55"),
  },
  {
    name: "55-60 NO",
    subtitle: `$${POSITIONS[2].price.toFixed(2)}`,
    side: "no" as const,
    price: POSITIONS[2].price,
    winsOn: ALL_SCENARIO_KEYS.filter((k) => k !== "55-60"),
  },
];

export default async function SeoulPrecipAnalysis() {
  const ctx = await requireUser();
  const viewerRole = ctx?.profile.role ?? null;
  const detail = await getAnalysisForDetail(SLUG, viewerRole);

  if (!detail) notFound();
  const { analysis, isAdmin, canView } = detail;

  // Tracker data (from daily cron snapshots) + event log
  const [snapshot, events, observations] = canView && analysis.has_prediction
    ? await Promise.all([
        latestSnapshot(analysis.id),
        listEvents(analysis.id, undefined, 80),
        listObservations(analysis.id),
      ])
    : [null, [], []];

  // Underlying fallback chain (snapshot → latest observation → hardcoded baseline)
  const latestObs = observations.length > 0 ? observations[observations.length - 1] : null;
  const currentMtdMm = snapshot?.underlying?.value
    ?? (latestObs ? Number(latestObs.value) : CURRENT_STATE.mtdMm);
  const liveSourceLabel = snapshot?.underlying?.asOf
    ? `KMA · ${new Date(snapshot.underlying.asOf).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
    : latestObs
      ? `KMA · ${new Date(latestObs.observed_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
      : `Snapshot · ${SEOUL_ANALYSIS_SNAPSHOT_DATE.slice(5)}`;

  // Build strike-rate strip from the live bucket structure.
  // Parse the range label to derive [lower, upper] bounds. upper=null → open-ended.
  const stripBuckets = MARKET_BUCKETS.map((b) => {
    const range = b.range;
    let lower = 0;
    let upper: number | null = null;
    const between = range.match(/^(\d+)-(\d+)/);
    const under = range.match(/^<(\d+)/);
    const plus = range.match(/^(\d+)\+/);
    if (under) {
      lower = 0;
      upper = parseFloat(under[1]);
    } else if (between) {
      lower = parseFloat(between[1]);
      upper = parseFloat(between[2]);
    } else if (plus) {
      lower = parseFloat(plus[1]);
      upper = null;
    }
    return {
      label: b.range,
      lower,
      upper,
      yesPrice: b.yesPrice,
      noPrice: b.noPrice,
    };
  });

  return (
    <div className={styles.layout}>
      <aside className={styles.navRail}>
        <AnalysisNav sections={SECTIONS} />
      </aside>

      <article className={styles.article}>
        <Hero
          eyebrow="Polymarket · Seúl"
          title={POLYMARKET_EVENT.title}
          standfirst="Análisis en profundidad."
        />

        <PolymarketEmbed
          marketSlug={POLYMARKET_EVENT.submarketSlugs.under40}
          fallbackHref={POLYMARKET_EVENT.url}
          title={`${POLYMARKET_EVENT.title} · <40mm`}
          height={340}
          features="volume"
        />

        {!canView ? (
          <div className={styles.paywallWrap}>
            <Callout tone="insight" title="Análisis completo para miembros">
              La parte pública es el seguimiento. Dentro, el razonamiento entero:
              cómo está cotizado el mercado, los datos históricos, los modelos,
              la ineficiencia y la posición con calculadora de ganancias.
            </Callout>
            <PaywallCTA isLoggedIn={!!ctx} />
          </div>
        ) : (
          <>
            {isAdmin && analysis.visibility === "hidden" && (
              <Callout tone="warn" title="Visibilidad: Privado">
                Sólo tú ves esto como admin. Cámbialo a público o premium para publicar.
              </Callout>
            )}

            {/* ────────────────── Seguimiento + Mercado ────────────────── */}
            <Section
              id="seguimiento"
              label="Seguimiento"
              eyebrow="qué pasa ahora mismo y dónde cotiza"
              title="Lluvia acumulada este mes en Seúl"
            >
              {isAdmin && (
                <div style={{ marginBottom: 12 }}>
                  <AdminTickButton analysisId={analysis.id} />
                </div>
              )}

              <LiveTrackerV2
                analysis={analysis}
                latest={
                  snapshot ?? buildFallbackSnapshot(analysis, currentMtdMm, liveSourceLabel)
                }
                events={events}
                buckets={stripBuckets.map((b) => ({
                  label: b.label,
                  lower: b.lower,
                  upper: b.upper,
                }))}
                reference={{ value: CURRENT_STATE.threshold, label: `${CURRENT_STATE.threshold} mm · umbral` }}
                underlyingSourceUrl={KMA_SOURCE_URL}
                underlyingSourceLabel="KMA-108"
              />

              <h3 className={styles.subHead}>Todos los buckets del evento</h3>
              <MarketTable rows={MARKET_BUCKETS} eventUrl={POLYMARKET_EVENT.url} />
            </Section>

            {/* ────────────────── Pasado ────────────────── */}
            <Section
              id="pasado"
              label="02"
              eyebrow="qué ha pasado otros abriles"
              title="Pasado"
            >
              <p className={styles.lead}>
                De los últimos diez abriles en Seúl, solo tres cerraron bajo
                40&nbsp;mm. La media está en 70. <strong>Haz click en una
                barra</strong> para ver el día a día de ese año.
              </p>

              <PastSection />
            </Section>

            {/* ────────────────── Futuro ────────────────── */}
            <Section
              id="futuro"
              label="03"
              eyebrow="qué dicen los modelos"
              title="Futuro"
            >
              <p className={styles.lead}>
                Cuatro modelos globales deterministas. Cada celda es la
                precipitación prevista para ese día. Cuanto más oscuro, más lluvia.
              </p>

              <ForecastTable
                rows={DETERMINISTIC_FORECASTS.map((f) => ({
                  model: f.model,
                  modelTerm: <Term slug={f.slug}>{f.model}</Term>,
                  daily: f.daily,
                  total: f.total,
                  note: f.note,
                }))}
                days={FORECAST_DAYS}
                threshold={{ value: 11.9 }}
                unit="mm"
              />

              <h3 className={styles.subHead}>
                Lo que piensan 30 versiones del mismo modelo
              </h3>
              <p className={styles.subLead}>
                Un <Term slug="ensemble">ensemble</Term> son muchas ejecuciones
                del mismo modelo con pequeñas variaciones. Cada línea es un
                escenario posible. Cuantas menos cruzan el umbral, más confianza.
              </p>

              <EnsembleSpaghetti
                members={GFS_ENSEMBLE_CUMULATIVE}
                days={FORECAST_DAYS}
                baseline={CURRENT_STATE.mtdMm}
                threshold={CURRENT_STATE.threshold}
                unit="mm"
              />

              <h3 className={styles.subHead}>Distribución de escenarios</h3>
              <p className={styles.subLead}>
                Los mismos 30 escenarios repartidos por rango final de lluvia.
                A la izquierda del umbral gana la tesis.
              </p>

              <EnsembleHistogram
                totals={GFS_ENSEMBLE_TOTALS.map((v) => v + CURRENT_STATE.mtdMm)}
                threshold={40}
                binSize={5}
                unit="mm"
              />

              <Callout tone="insight">
                <strong>23 de 30 escenarios</strong> terminan abril por debajo
                de 40 mm. Eso es <strong>77 %</strong>.
              </Callout>

              <h3 className={styles.subHead}>
                Cuánto EV tiene cada bucket
              </h3>
              <p className={styles.subLead}>
                Traduce los 30 escenarios del ensemble a probabilidad por bucket y
                compara con el precio actual en Polymarket. El EV se muestra del
                lado (YES o NO) donde haya edge.
              </p>

              <EnsembleVsMarket
                ensembleTotals={GFS_ENSEMBLE_TOTALS}
                baseline={CURRENT_STATE.mtdMm}
                buckets={stripBuckets}
              />
            </Section>

            {/* ────────────────── Ineficiencia y EV ────────────────── */}
            <Section
              id="ineficiencia"
              label="04"
              eyebrow="por qué hay dinero que recoger"
              title="Ineficiencia y EV"
            >
              <p className={styles.lead}>
                El mercado paga el &lt;40 como si fuera un 48 % probable. Mi lectura,
                condicionada a lo que sabemos y a los modelos, está en el 77 %.
                Desliza el valor que consideres razonable y mira qué sale.
              </p>

              <EVCalculator legs={POSITIONS} defaultP={0.75} currency="$" />

              <Callout tone="info">
                El <Term slug="break-even">break-even</Term> está bastante por
                debajo de mi estimación. Aunque me equivoque y la probabilidad
                real sea del 55 %, el trade sigue siendo rentable.
              </Callout>
            </Section>

            {/* ────────────────── La posición ────────────────── */}
            <Section
              id="posicion"
              label="05"
              eyebrow="cómo lo pondrías tú"
              title="La posición"
            >
              <p className={styles.lead}>
                Tres patas. La principal es <strong>&lt;40 YES</strong>. Las
                otras dos apuestan a que dos buckets vacíos seguirán vacíos.
                Indica cuánto quieres poner y cómo repartirlo.
              </p>

              <PositionCalculator
                legs={positionLegs}
                scenarios={scenarios}
                defaultCapital={1000}
                defaultAllocation={[0.6, 0.3, 0.1]}
                currency="$"
              />
            </Section>

            {/* ────────────────── Riesgos ────────────────── */}
            <Section
              id="riesgos"
              label="06"
              eyebrow="qué puede salir mal"
              title="Riesgos"
            >
              <dl className={styles.riskGrid}>
                <div className={styles.risk}>
                  <dt className={styles.riskTitle}>Un frente estancado de última hora</dt>
                  <dd className={styles.riskBody}>
                    En 2018 cayeron 59 mm en un solo 23 de abril. Si los modelos
                    suben la previsión de forma consistente, salgo.
                  </dd>
                </div>
                <div className={styles.risk}>
                  <dt className={styles.riskTitle}>Cierre exacto en 40.0 mm</dt>
                  <dd className={styles.riskBody}>
                    Por <Term slug="tie-break">regla del mercado</Term>, va al
                    bucket siguiente. Opcional: comprar 40-45 YES a $0.14 como
                    pequeño seguro de frontera.
                  </dd>
                </div>
                <div className={styles.risk}>
                  <dt className={styles.riskTitle}>Liquidez modesta</dt>
                  <dd className={styles.riskBody}>
                    Entrar con más de $1.000 puede mover el precio. Ejecutar en
                    dos o tres órdenes.
                  </dd>
                </div>
              </dl>
            </Section>

            <footer className={styles.footerSources}>
              <h3 className={styles.footerTitle}>Fuentes</h3>
              <div className={styles.sourcesGrid}>
                {SOURCES.map((s) => (
                  <Source
                    key={s.href}
                    name={s.name}
                    href={s.href}
                    domain={s.domain}
                    caption={s.caption}
                  />
                ))}
              </div>
            </footer>
          </>
        )}
      </article>
    </div>
  );
}
