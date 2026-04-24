import { type SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "./server";
import type {
  Analysis,
  AnalysisObservation,
  AnalysisPublic,
  AnalysisVisibility,
  Database,
} from "./types";

type DbClient = SupabaseClient<Database>;

/**
 * Service-role Supabase client for the analyses table. Uses the current
 * environment's DB (dev in local, prod in production). Column projection
 * via PUBLIC_COLUMNS keeps admin_notes_md out of public responses.
 *
 * Posts/newsletter use a cross-env PROD_* override; we deliberately don't
 * mirror that pattern here so local dev against dev DB stays straightforward.
 */
export function createAnalysesClient() {
  return createServiceClient();
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

export async function listAdminAnalyses(
  client?: DbClient,
): Promise<Analysis[]> {
  const db = client ?? createAnalysesClient();
  const { data, error } = await db
    .from("analyses")
    .select(ADMIN_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Analysis[];
}

export async function getAnalysisForAdmin(
  slug: string,
  client?: DbClient,
): Promise<Analysis | null> {
  const db = client ?? createAnalysesClient();
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
  client?: DbClient,
): Promise<AnalysisObservation[]> {
  const db = client ?? createAnalysesClient();
  const { data, error } = await db
    .from("analysis_observations")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("observed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AnalysisObservation[];
}

/* ── Tracker helpers ── */

export async function listSnapshots(
  analysisId: string,
  client?: DbClient,
): Promise<import("./types").AnalysisSnapshot[]> {
  const db = client ?? createAnalysesClient();
  const { data, error } = await db
    .from("analysis_snapshots")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("snapshot_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as import("./types").AnalysisSnapshot[];
}

export async function latestSnapshot(
  analysisId: string,
  client?: DbClient,
): Promise<import("./types").AnalysisSnapshot | null> {
  const db = client ?? createAnalysesClient();
  const { data } = await db
    .from("analysis_snapshots")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as import("./types").AnalysisSnapshot | null) ?? null;
}

export async function listEvents(
  analysisId: string,
  client?: DbClient,
  limit = 60,
): Promise<import("./types").AnalysisEvent[]> {
  const db = client ?? createAnalysesClient();
  const { data, error } = await db
    .from("analysis_events")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as import("./types").AnalysisEvent[];
}
