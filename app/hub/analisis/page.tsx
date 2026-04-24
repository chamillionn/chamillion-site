import Link from "next/link";
import Image from "next/image";
import {
  listMemberAnalyses,
  latestSnapshot,
} from "@/lib/supabase/analyses-client";
import type { AnalysisPublic, AnalysisSnapshot } from "@/lib/supabase/types";
import AnalysisStatusChip from "@/components/analisis/analysis-status-chip";
import styles from "./analisis.module.css";

export const metadata = { title: "Análisis" };

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function HubAnalisis() {
  let analyses: AnalysisPublic[] = [];
  try {
    analyses = await listMemberAnalyses();
  } catch (e) {
    console.error("Hub analisis fetch failed:", e);
  }

  const publicCount = analyses.filter((a) => a.visibility === "public").length;
  const premiumCount = analyses.filter((a) => a.visibility === "premium").length;

  const snapshots = await Promise.all(
    analyses.map((a) =>
      a.has_prediction ? latestSnapshot(a.id).catch(() => null) : Promise.resolve(null),
    ),
  );
  const snapshotByAnalysis = new Map<string, AnalysisSnapshot | null>();
  analyses.forEach((a, i) => snapshotByAnalysis.set(a.id, snapshots[i]));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Hub · Investigación</div>
        <h1 className={styles.heading}>Análisis</h1>
        <p className={styles.intro}>
          Tesis de inversión y análisis de oportunidades. Cada ficha
          incluye el resumen curado y, cuando aplica, el seguimiento de la
          predicción contra la realidad.
        </p>
        <div className={styles.counts}>
          <span className={styles.countPill}>
            {publicCount} público{publicCount !== 1 ? "s" : ""}
          </span>
          <span className={`${styles.countPill} ${styles.countPremium}`}>
            {premiumCount} premium
          </span>
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className={styles.emptyState}>
          No hay análisis todavía. Vuelve pronto.
        </div>
      ) : (
        <div className={styles.grid}>
          {analyses.map((a) => (
            <Link
              key={a.id}
              href={`/analisis/${a.slug}`}
              className={styles.card}
            >
              {a.visibility === "premium" && (
                <span className={styles.premiumCorner}>Premium</span>
              )}

              {a.banner_path ? (
                <div className={styles.cardBanner}>
                  <Image
                    src={a.banner_path}
                    alt=""
                    width={640}
                    height={267}
                    sizes="(max-width: 700px) 100vw, 340px"
                  />
                  {a.asset && (
                    <span className={styles.cardAssetBadge}>{a.asset}</span>
                  )}
                </div>
              ) : (
                <div className={styles.cardBannerPlaceholder}>
                  {a.asset && (
                    <span className={styles.placeholderAsset}>{a.asset}</span>
                  )}
                </div>
              )}

              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  {a.section && (
                    <span className={styles.cardSection}>{a.section}</span>
                  )}
                  {a.published_at && (
                    <span className={styles.cardDate}>
                      {formatDate(a.published_at)}
                    </span>
                  )}
                  <AnalysisStatusChip
                    analysis={a}
                    latestSnapshot={snapshotByAnalysis.get(a.id) ?? null}
                  />
                </div>

                <h2 className={styles.cardTitle}>{a.title}</h2>
                {a.thesis && <p className={styles.cardThesis}>{a.thesis}</p>}

                <div className={styles.cardArrow}>
                  Abrir análisis
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
