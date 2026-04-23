import { createClient } from "@supabase/supabase-js";
import type {
  Analysis,
  AnalysisObservation,
  AnalysisPublic,
  AnalysisVisibility,
  Database,
} from "./types";

/**
 * Service-role Supabase client for the analyses table. Follows the same
 * dev→prod override pattern as createPostsClient: uses PROD_* vars when
 * present (so dev builds can read prod content), falls back to the
 * native env otherwise. Bypasses RLS — column projection is the layer
 * that keeps admin_notes_md out of public responses.
 */
export function createAnalysesClient() {
  const url =
    process.env.PROD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

/**
 * Columns safe to send to any viewer. Crucially excludes admin_notes_md.
 * All non-admin queries must project via PUBLIC_COLUMNS.
 */
export const PUBLIC_COLUMNS =
  "id,slug,title,subtitle,asset,thesis,section,banner_path,summary_md,visibility,published_at,created_at,updated_at,prediction_asset,prediction_source,prediction_direction,prediction_baseline_value,prediction_target_value,prediction_start_date,prediction_end_date,prediction_unit,has_prediction" as const;

export const ADMIN_COLUMNS = "*" as const;

export async function listPublicAnalyses(): Promise<AnalysisPublic[]> {
  const db = createAnalysesClient();
  const { data, error } = await db
    .from("analyses")
    .select(PUBLIC_COLUMNS)
    .eq("visibility", "public")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as AnalysisPublic[];
}

export async function listMemberAnalyses(): Promise<AnalysisPublic[]> {
  const db = createAnalysesClient();
  const { data, error } = await db
    .from("analyses")
    .select(PUBLIC_COLUMNS)
    .in("visibility", ["public", "premium"])
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as AnalysisPublic[];
}

export type ViewerRole = "admin" | "member" | "free" | null;

export interface AnalysisDetail {
  /** Row with admin_notes_md when isAdmin=true, public columns otherwise. */
  analysis: Analysis | AnalysisPublic;
  /** Admin got the full row. UI may show admin-only controls/banners. */
  isAdmin: boolean;
  /** Viewer may see the full body. False means paywall teaser flow. */
  canView: boolean;
}

/**
 * Fetch an analysis for the detail page. Applies visibility rules:
 * - admin: sees any visibility, including hidden, with admin_notes_md.
 * - member: sees public + premium, full body. Hidden returns null (→ 404).
 * - free/anon: sees public (canView=true) and premium (canView=false → paywall).
 *   Hidden returns null.
 * Returns null when the analysis doesn't exist or the viewer can't even see metadata.
 */
export async function getAnalysisForDetail(
  slug: string,
  viewerRole: ViewerRole,
): Promise<AnalysisDetail | null> {
  const db = createAnalysesClient();

  if (viewerRole === "admin") {
    const { data } = await db
      .from("analyses")
      .select(ADMIN_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    return { analysis: data as Analysis, isAdmin: true, canView: true };
  }

  const { data } = await db
    .from("analyses")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .in("visibility", ["public", "premium"] as AnalysisVisibility[])
    .maybeSingle();

  if (!data) return null;

  const row = data as AnalysisPublic;
  if (row.visibility === "public") {
    return { analysis: row, isAdmin: false, canView: true };
  }
  // premium
  const canView = viewerRole === "member";
  return { analysis: row, isAdmin: false, canView };
}

export async function listAdminAnalyses(): Promise<Analysis[]> {
  const db = createAnalysesClient();
  const { data, error } = await db
    .from("analyses")
    .select(ADMIN_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Analysis[];
}

export async function getAnalysisForAdmin(
  slug: string,
): Promise<Analysis | null> {
  const db = createAnalysesClient();
  const { data } = await db
    .from("analyses")
    .select(ADMIN_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Analysis | null) ?? null;
}

/* ── Observations ── */

export async function listObservations(
  analysisId: string,
): Promise<AnalysisObservation[]> {
  const db = createAnalysesClient();
  const { data, error } = await db
    .from("analysis_observations")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("observed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AnalysisObservation[];
}
