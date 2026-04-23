/**
 * Pure registry → DB reconciliation. Called from admin page render.
 * Does NOT trigger revalidation (that'd violate Next 15's render rules).
 * Idempotent: mirrors registry metadata into DB; visibility/published_at
 * are left untouched so the user's toggle state is preserved.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ANALYSIS_REGISTRY } from "@/app/analisis/registry";
import type { AnalysisVisibility, Database } from "@/lib/supabase/types";

type DbClient = SupabaseClient<Database>;

export async function reconcileRegistry(db: DbClient): Promise<{
  inserted: number;
  updated: number;
  error?: string;
}> {
  const { data: existing, error: readError } = await db
    .from("analyses")
    .select("slug,visibility,published_at")
    .in(
      "slug",
      ANALYSIS_REGISTRY.map((e) => e.slug),
    );

  if (readError) return { inserted: 0, updated: 0, error: readError.message };

  const existingBySlug = new Map(
    (existing ?? []).map((r) => [
      r.slug,
      r as { slug: string; visibility: AnalysisVisibility; published_at: string | null },
    ]),
  );

  let inserted = 0;
  let updated = 0;

  for (const entry of ANALYSIS_REGISTRY) {
    const predictionFields = entry.prediction
      ? {
          prediction_asset: entry.prediction.asset,
          prediction_source: entry.prediction.source,
          prediction_direction: entry.prediction.direction,
          prediction_baseline_value: entry.prediction.baselineValue,
          prediction_target_value: entry.prediction.targetValue,
          prediction_start_date: entry.prediction.startDate,
          prediction_end_date: entry.prediction.endDate,
          prediction_unit: entry.prediction.unit,
        }
      : {
          prediction_asset: null,
          prediction_source: null,
          prediction_direction: null,
          prediction_baseline_value: null,
          prediction_target_value: null,
          prediction_start_date: null,
          prediction_end_date: null,
          prediction_unit: null,
        };

    const metaFields = {
      title: entry.title,
      subtitle: entry.subtitle ?? null,
      asset: entry.asset ?? null,
      thesis: entry.thesis ?? null,
      section: entry.section ?? null,
      banner_path: entry.bannerPath ?? null,
      summary_md: "",
      admin_notes_md: null,
    };

    if (!existingBySlug.has(entry.slug)) {
      const { error } = await db.from("analyses").insert({
        slug: entry.slug,
        visibility: "hidden",
        published_at: null,
        ...metaFields,
        ...predictionFields,
      });
      if (error) return { inserted, updated, error: error.message };
      inserted++;
    } else {
      const { error } = await db
        .from("analyses")
        .update({
          ...metaFields,
          ...predictionFields,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", entry.slug);
      if (error) return { inserted, updated, error: error.message };
      updated++;
    }
  }

  return { inserted, updated };
}
