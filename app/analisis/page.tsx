import Link from "next/link";
import Image from "next/image";
import { listPublicAnalyses } from "@/lib/supabase/analyses-client";
import type { AnalysisPublic } from "@/lib/supabase/types";
import styles from "./analisis.module.css";

export const revalidate = 300; // 5 min ISR

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate();
  const month = d
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default async function AnalisisIndex() {
  let analyses: AnalysisPublic[] = [];
  try {
    analyses = await listPublicAnalyses();
  } catch (e) {
    console.error("Analisis fetch failed:", e);
  }

  return (
    <div className={styles.container}>
      <div className={styles.indexHeader}>
        <div className={styles.eyebrow}>Investigación</div>
        <h1 className={styles.heading}>Análisis</h1>
        <p className={styles.intro}>
          Tesis de inversión y análisis de oportunidades. Documentadas,
          seguidas con datos reales, y contrastadas con el tiempo.
        </p>
      </div>

      <div className={styles.divider} />

      {analyses.length === 0 ? (
        <div className={styles.emptyState}>
          Todavía no hay análisis publicados.
        </div>
      ) : (
        <div className={styles.grid}>
          {analyses.map((a) => (
            <Link key={a.id} href={`/analisis/${a.slug}`} className={styles.card}>
              {a.banner_path && (
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
              )}

              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  {a.section && <span className={styles.cardSection}>{a.section}</span>}
                  {!a.banner_path && a.asset && (
                    <span className={styles.cardSection}>{a.asset}</span>
                  )}
                  {a.published_at && (
                    <span className={styles.cardDate}>{formatDate(a.published_at)}</span>
                  )}
                </div>

                <h2 className={styles.cardTitle}>{a.title}</h2>
                {a.thesis && <p className={styles.cardThesis}>{a.thesis}</p>}

                <div className={styles.cardArrow}>
                  Leer análisis
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
