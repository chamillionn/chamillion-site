import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import {
  getAnalysisForDetail,
  listObservations,
  latestSnapshot,
} from "@/lib/supabase/analyses-client";
import PaywallCTA from "@/components/paywall-cta";
import Callout from "@/components/analisis/callout";
import { CURRENT_STATE, POLYMARKET_EVENT, KMA_SOURCE_URL } from "./data";
import MarketsPanel from "./markets-panel/markets-panel";
import HistoricalCard from "./historical-card/historical-card";
import ThesisSection from "./thesis-section/thesis-section";
import StatusVitals from "./status-vitals";
import SourceLinks from "./source-links";
import RefreshDialog from "./refresh-dialog";
import styles from "./page.module.css";

const SLUG = "seoul-precip-abr-2026";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: POLYMARKET_EVENT.title,
    description:
      "Análisis en profundidad del mercado Polymarket sobre la precipitación mensual en Seúl.",
    alternates: { canonical: `https://chamillion.site/analisis/${SLUG}` },
  };
}

export default async function SeoulPrecipAnalysis() {
  const ctx = await requireUser();
  const viewerRole = ctx?.profile.role ?? null;
  const detail = await getAnalysisForDetail(SLUG, viewerRole);
  if (!detail) notFound();
  const { analysis, canView } = detail;

  const [snapshot, observations] = canView && analysis.has_prediction
    ? await Promise.all([latestSnapshot(analysis.id), listObservations(analysis.id)])
    : [null, []];

  const latestObs = observations.length > 0 ? observations[observations.length - 1] : null;
  const currentMtdMm = (snapshot?.underlying?.value as number | undefined)
    ?? (latestObs ? Number(latestObs.value) : CURRENT_STATE.mtdMm);

  const sourceLabel = (() => {
    const asOf = snapshot?.underlying?.asOf as string | undefined;
    if (asOf) {
      return `KMA · ${new Date(asOf).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
    }
    if (latestObs) {
      return `KMA · ${new Date(latestObs.observed_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
    }
    return `KMA · ${CURRENT_STATE.asOfDate.slice(5)}`;
  })();

  const isAdmin = viewerRole === "admin";
  const isResolved = !!analysis.resolved_at;
  const status = isResolved ? "RESUELTO" : "EN VIVO";
  const resolutionLabel = (() => {
    const target = Date.parse(POLYMARKET_EVENT.resolutionDate);
    if (!Number.isFinite(target)) return POLYMARKET_EVENT.resolutionDate;
    return new Date(target).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  })();

  return (
    <div className={styles.shell}>
      <header className={styles.statusBar}>
        <div className={styles.statusIdent}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {status} · POLYMARKET · {sourceLabel.toUpperCase()}
            {isAdmin && <RefreshDialog />}
          </span>
          <div className={styles.titleRow}>
            <h1 className={styles.statusTitle}>{POLYMARKET_EVENT.title}</h1>
            <SourceLinks
              polymarketUrl={POLYMARKET_EVENT.url}
              kmaUrl={KMA_SOURCE_URL}
            />
          </div>
        </div>

        <StatusVitals
          mtdMm={currentMtdMm}
          threshold={CURRENT_STATE.threshold}
          resolutionDate={POLYMARKET_EVENT.resolutionDate}
          resolutionLabel={resolutionLabel}
          isResolved={isResolved}
        />
      </header>

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
        <main className={styles.dashboard}>
          <section className={styles.dashLeft}>
            <MarketsPanel snapshot={snapshot} currentMtdMm={currentMtdMm} />
            <HistoricalCard
              currentMtdMm={currentMtdMm}
              threshold={CURRENT_STATE.threshold}
            />
          </section>
          <aside className={styles.dashRight}>
            <ThesisSection forecasts={snapshot?.forecasts ?? null} />
          </aside>
        </main>
      )}
    </div>
  );
}
