import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Analysis,
  TrackerUnderlying,
  TrackerPosition,
  TrackerEdge,
  AnalysisEvent,
  Database,
} from "@/lib/supabase/types";
import type { RegistryTracker } from "@/app/analisis/registry";

export type TrackerDb = SupabaseClient<Database>;

/**
 * Result of a single tracker tick. Returned by resolvers, consumed by the cron.
 */
export interface TickResult {
  underlying: TrackerUnderlying | null;
  position: TrackerPosition | null;
  edge: TrackerEdge | null;
  /** Events to append (cron dedupes by dedup_key) */
  events: Array<Pick<AnalysisEvent, "occurred_at" | "type" | "payload" | "source" | "dedup_key">>;
  /** Optional warnings for logs / admin panel */
  warnings?: string[];
}

/**
 * Contract every tracker kind implements. The cron dispatches based on
 * `tracker.kind` to the right resolver.
 */
export type TrackerResolver<C extends RegistryTracker = RegistryTracker> = (
  analysis: Analysis,
  cfg: C,
  opts: { db: TrackerDb; signal?: AbortSignal },
) => Promise<TickResult>;
