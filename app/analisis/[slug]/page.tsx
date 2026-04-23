import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireUser } from "@/lib/supabase/auth";
import {
  getAnalysisForDetail,
  listObservations,
  listPublicAnalyses,
} from "@/lib/supabase/analyses-client";
import PaywallCTA from "@/components/paywall-cta";
import PredictionChart from "./prediction-chart";
import styles from "../analisis.module.css";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const analyses = await listPublicAnalyses();
    return analyses.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await requireUser();
  const viewerRole = ctx?.profile.role ?? null;
  const detail = await getAnalysisForDetail(slug, viewerRole);
  if (!detail) return { title: "Análisis" };

  const { analysis } = detail;
  return {
    title: `${analysis.title} — Análisis`,
    description: analysis.subtitle || analysis.thesis || undefined,
    alternates: { canonical: `https://chamillion.site/analisis/${analysis.slug}` },
    openGraph: {
      title: analysis.title,
      description: analysis.subtitle || analysis.thesis || undefined,
      images: analysis.banner_path
        ? [{ url: analysis.banner_path, width: 1200, height: 630 }]
        : undefined,
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AnalysisDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireUser();
  const viewerRole = ctx?.profile.role ?? null;

  const detail = await getAnalysisForDetail(slug, viewerRole);
  if (!detail) notFound();

  const { analysis, isAdmin, canView } = detail;

  // Observations: only fetch when the viewer can see the body (they inherit
  // the analysis visibility through RLS, but it's pointless to ship them when
  // the body is paywalled).
  const observations = canView && analysis.has_prediction
    ? await listObservations(analysis.id)
    : [];

  return (
    <article className={styles.article}>
      <div className={styles.articleHeader}>
        <div className={styles.articleEyebrow}>
          <Link href="/analisis">Análisis</Link>
          {analysis.section && (
            <>
              <span className={styles.articleEyebrowSep}>·</span>
              <span>{analysis.section}</span>
            </>
          )}
          {analysis.asset && (
            <>
              <span className={styles.articleEyebrowSep}>·</span>
              <span>{analysis.asset}</span>
            </>
          )}
        </div>

        <h1 className={styles.articleTitle}>{analysis.title}</h1>
        {analysis.subtitle && (
          <p className={styles.articleSubtitle}>{analysis.subtitle}</p>
        )}

        <div className={styles.articleMeta}>
          {analysis.published_at && (
            <span className={styles.articleMetaItem}>
              {formatDate(analysis.published_at)}
            </span>
          )}
          {analysis.thesis && (
            <span
              className={`${styles.articleMetaItem} ${styles.articleMetaBadge}`}
            >
              {analysis.thesis}
            </span>
          )}
          {analysis.visibility === "premium" && (
            <span className={styles.articleMetaBadgePremium}>Premium</span>
          )}
          {analysis.visibility === "hidden" && isAdmin && (
            <span className={styles.articleMetaBadgeHidden}>Oculto</span>
          )}
        </div>
      </div>

      {isAdmin && analysis.visibility === "hidden" && (
        <div className={styles.hiddenBanner}>
          Este análisis está oculto — sólo lo ves como admin.
        </div>
      )}

      {analysis.banner_path && (
        <div className={styles.articleBanner}>
          <Image
            src={analysis.banner_path}
            alt=""
            width={1520}
            height={633}
            sizes="(max-width: 760px) 100vw, 760px"
            priority
          />
        </div>
      )}

      {canView && analysis.has_prediction && (
        <PredictionChart analysis={analysis} observations={observations} />
      )}

      {canView ? (
        <div className={styles.body}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {analysis.summary_md}
          </ReactMarkdown>
        </div>
      ) : (
        <PremiumPaywall isLoggedIn={!!ctx} thesis={analysis.thesis} />
      )}
    </article>
  );
}

function PremiumPaywall({
  isLoggedIn,
  thesis,
}: {
  isLoggedIn: boolean;
  thesis: string | null;
}) {
  return (
    <div>
      <div className={styles.body}>
        {thesis && <p>{thesis}</p>}
        <p>
          Este análisis está reservado para miembros del hub. Dentro
          encontrarás la tesis completa, el razonamiento y el seguimiento
          de la predicción con datos reales.
        </p>
      </div>
      <div
        aria-hidden="true"
        style={{
          opacity: 0.3,
          filter: "blur(6px)",
          userSelect: "none",
          pointerEvents: "none",
          marginTop: 12,
        }}
      >
        <div className={styles.body}>
          <p>
            El detalle de la tesis, los catalizadores, los niveles de entrada
            y salida, y la comparación contra la realidad se actualizan dentro
            del hub.
          </p>
          <p>
            Cada análisis incluye un comparador predicción-vs-realidad
            que se alimenta periódicamente.
          </p>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <PaywallCTA isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
