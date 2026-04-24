/**
 * Supabase database types for chamillion.site
 *
 * Mirrors the schema defined in Supabase. Regenerate with:
 *   npx supabase gen types typescript --project-id <ID> > lib/supabase/types.ts
 */

/* ── Row types (match DB columns) ── */

export interface Platform {
  id: string;
  name: string;
  type: string;
  url: string | null;
  referral_url: string | null;
  logo_url: string | null;
  wallet_address: string | null;
}

export interface Strategy {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

export interface Position {
  id: string;
  asset: string;
  size: number;
  cost_basis: number;
  current_value: number;
  platform_id: string | null;
  strategy_id: string | null;
  notes: string | null;
  is_active: boolean;
  opened_at: string;
  closed_at: string | null;
}

export interface SnapshotPosition {
  id?: string; // position id for traceability (added v2, absent in older snapshots)
  asset: string;
  platform: string | null;
  strategy: string | null;
  size: number;
  cost_basis: number;
  current_value: number;
  pnl: number;
  roi_pct: number;
  allocation_pct: number;
}

export interface Snapshot {
  id: string;
  snapshot_date: string; // ISO timestamptz
  total_value: number;
  total_cost: number;
  eurusd_rate: number | null;
  positions_data: SnapshotPosition[] | null;
  notes: string | null;
  created_at: string;
}

// Snapshot without positions_data payload — used for list views
// where positions are lazy-loaded on row expansion.
export type SnapshotSummary = Omit<Snapshot, "positions_data">;

export type CapitalFlowType = "buy" | "sell" | "deposit_fiat" | "withdraw_fiat";

export interface CapitalFlow {
  id: string;
  date: string;
  type: CapitalFlowType;
  amount_eur: number;
  asset: string | null;
  quantity: number | null;
  price_per_unit: number | null;
  exchange: string | null;
  notes: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: "free" | "member" | "admin";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null; // none | active | past_due | canceled | trialing
  subscribed_at: string | null;
}

/**
 * Settings per-post del editor de borradores. NO es contenido ni metadata
 * publicable — es cómo el admin ve el draft. Crece sin migraciones: añade
 * un campo opcional y persiste vía `updateEditorState()`.
 *
 * NO poner aquí: title, subtitle, banner_path, banner_aspect, content_json,
 * content_md, premium, published, section. Esos tienen columna propia.
 */
export interface EditorState {
  // Añade settings aquí según los vayas necesitando. Ejemplos:
  // focusMode?: boolean;
  // customToolbarOrder?: string[];
  // collapsedCallouts?: string[];
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  date: string; // YYYY-MM-DD
  banner_path: string | null;
  banner_aspect: string | null; // CSS aspect-ratio, null = 3/1 default
  section: string | null; // e.g. "Reporte de la Cartera" | "Deep Dives"
  substack_url: string | null;
  premium: boolean;
  published: boolean;
  created_at: string;
  content_json: unknown | null; // TipTap ProseMirror doc
  content_md: string | null;
  draft_updated_at: string | null;
  editor_state: EditorState; // jsonb, default {}
}

export interface SiteSetting {
  key: string;
  value: unknown; // JSONB — cast per key
  updated_at: string;
}

export interface PendingLogin {
  id: string;
  email: string;
  token_hash: string | null;
  verified_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface Software {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  icon_path: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SoftwareVersion {
  id: string;
  software_id: string;
  version: string;
  release_notes: string | null;
  file_path: string;
  file_size: number | null;
  is_latest: boolean;
  released_at: string;
}

export interface Download {
  id: string;
  user_id: string;
  version_id: string;
  created_at: string;
}

export interface SoftwareWithLatest {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  icon_path: string | null;
  is_active: boolean;
  created_at: string;
  latest_version_id: string | null;
  latest_version: string | null;
  latest_release_notes: string | null;
  latest_file_path: string | null;
  latest_file_size: number | null;
  latest_released_at: string | null;
}

export interface ConsultationType {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price_eur: number;
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  created_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  type_id: string;
  scheduled_at: string;
  duration: number;
  status: string;
  stripe_payment_id: string | null;
  stripe_session_id: string | null;
  notes_user: string | null;
  notes_admin: string | null;
  created_at: string;
}

export interface EmailPreferences {
  user_id: string;
  daily_digest: boolean;
  digest_hour: number;
  updated_at: string;
}

export interface KronosPrediction {
  id: string;
  symbol: string;
  timeframe: string;
  model: string;
  email: string | null;
  comment: string | null;
  input_candles: unknown;
  predicted_candles: unknown;
  input_range_start: string | null;
  input_range_end: string | null;
  pred_range_start: string | null;
  pred_range_end: string | null;
  created_at: string;
}

export type TradeSide = "buy" | "sell" | "open_long" | "open_short" | "close_long" | "close_short";

export type AnalysisVisibility = "public" | "premium" | "hidden";
export type PredictionDirection = "bullish" | "bearish" | "neutral";
export type PredictionSource = "manual" | "binance";
export type ObservationSource = "manual" | "binance" | "twelvedata";

export type AnalysisOutcome = "cumplida" | "fallida" | "neutral";

export interface Analysis {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  asset: string | null;
  thesis: string | null;
  section: string | null;
  banner_path: string | null;
  summary_md: string;
  admin_notes_md: string | null;
  visibility: AnalysisVisibility;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Prediction metadata (nullable — only set when the analysis tracks one).
  prediction_asset: string | null;
  prediction_source: PredictionSource | null;
  prediction_direction: PredictionDirection | null;
  prediction_baseline_value: number | null;
  prediction_target_value: number | null;
  prediction_start_date: string | null; // YYYY-MM-DD
  prediction_end_date: string | null;   // YYYY-MM-DD
  prediction_unit: string | null;
  has_prediction: boolean;              // generated column
  // Resolution (set by the tracker cron when prediction_end_date passes).
  resolved_at: string | null;
  final_outcome: AnalysisOutcome | null;
  final_roi_pct: number | null;
}

// Narrowed variant without admin_notes_md — returned by non-admin queries.
export type AnalysisPublic = Omit<Analysis, "admin_notes_md">;

export interface AnalysisObservation {
  id: string;
  analysis_id: string;
  observed_at: string;
  value: number;
  source: ObservationSource | null;
  note: string | null;
  created_at: string;
}

/* ── Tracker: daily snapshot (position + edge + underlying) ── */

export interface TrackerUnderlying {
  value: number;
  unit: string;
  source: string; // "polymarket" | "kma" | "manual" | "binance" | ...
  asOf: string;   // ISO timestamp
}

export interface TrackerPositionLeg {
  name: string;
  side: "YES" | "NO";
  size: number;
  avgPrice: number;
  curPrice: number;
  cashPnl: number;
  pnlPct: number;
  marketSlug?: string;
  conditionId?: string;
}

export interface TrackerPosition {
  legs: TrackerPositionLeg[];
  totalCashPnl: number;
  totalNotional: number;
  cashUsdc?: number;
}

export interface TrackerEdge {
  evAbs: number;        // expected value in currency units
  evPct: number;        // ROI pct
  myProb: number;       // 0-1
  mktProb: number;      // 0-1 — implied prob derived from current market
  source: string;       // e.g. "gfs-ensemble"
  note?: string;
}

// Backward-compatible aliases for earlier iterations of this iteration's code.
export type SnapshotUnderlying = TrackerUnderlying;
export type SnapshotPositionLeg = TrackerPositionLeg;
export type TrackerSnapshotPosition = TrackerPosition;
export type SnapshotEdge = TrackerEdge;

export interface AnalysisSnapshot {
  id: string;
  analysis_id: string;
  snapshot_date: string; // YYYY-MM-DD
  underlying: TrackerUnderlying | null;
  position: TrackerPosition | null;
  edge: TrackerEdge | null;
  created_at: string;
}

/* ── Tracker: event log (orders, resolution, notes) ── */

export type AnalysisEventType =
  | "order_placed"
  | "order_filled"
  | "order_cancelled"
  | "position_opened"
  | "position_closed"
  | "resolution"
  | "note";

export type AnalysisEventSource =
  | "polymarket"
  | "manual"
  | "kma"
  | "cron"
  | "binance"
  | "twelvedata";

export interface AnalysisEvent {
  id: string;
  analysis_id: string;
  occurred_at: string;
  type: AnalysisEventType;
  payload: Record<string, unknown> | null;
  source: AnalysisEventSource | null;
  dedup_key: string | null;
  created_at: string;
}

export interface Trade {
  id: string;
  platform_id: string | null;
  asset: string;
  side: TradeSide;
  quantity: number;
  price: number;
  total_value: number;
  total_value_eur: number | null;
  fee: number | null;
  trade_id: string | null;
  executed_at: string;
  synced_at: string;
}

/* ── View types ── */

export interface PositionEnriched {
  id: string;
  asset: string;
  size: number;
  cost_basis: number;
  current_value: number;
  pnl: number;
  roi_pct: number;
  allocation_pct: number;
  platform_id: string | null;
  platform_name: string | null;
  strategy_id: string | null;
  strategy_name: string | null;
  notes: string | null;
  opened_at: string;
}

export interface TradeEnriched extends Trade {
  platform_name: string | null;
}

export interface PortfolioSummary {
  total_positions: number;
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_roi_pct: number;
}

/* ── Supabase generic Database type ── */

/** Forces TypeScript to eagerly resolve Omit/Partial into plain object types.
 *  Required for Supabase client generics (conditional type resolution). */
type Flatten<T> = { [K in keyof T]: T[K] };

export type Database = {
  public: {
    Tables: {
      platforms: {
        Row: Flatten<Platform>;
        Insert: Flatten<Omit<Platform, "id" | "referral_url" | "logo_url"> & { id?: string; referral_url?: string | null; logo_url?: string | null }>;
        Update: Flatten<Partial<Platform>>;
        Relationships: [];
      };
      strategies: {
        Row: Flatten<Strategy>;
        Insert: Flatten<Omit<Strategy, "id" | "description"> & { id?: string; description?: string | null }>;
        Update: Flatten<Partial<Strategy>>;
        Relationships: [];
      };
      positions: {
        Row: Flatten<Position>;
        Insert: Flatten<Omit<Position, "id" | "strategy_id" | "notes" | "closed_at"> & { id?: string; strategy_id?: string | null; notes?: string | null; closed_at?: string | null }>;
        Update: Flatten<Partial<Position>>;
        Relationships: [
          { foreignKeyName: "positions_platform_id_fkey"; columns: ["platform_id"]; referencedRelation: "platforms"; referencedColumns: ["id"]; isOneToOne: false },
          { foreignKeyName: "positions_strategy_id_fkey"; columns: ["strategy_id"]; referencedRelation: "strategies"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      snapshots: {
        Row: Flatten<Snapshot>;
        Insert: Flatten<Omit<Snapshot, "id" | "created_at" | "notes" | "eurusd_rate"> & { id?: string; created_at?: string; notes?: string | null; eurusd_rate?: number | null }>;
        Update: Flatten<Partial<Snapshot>>;
        Relationships: [];
      };
      profiles: {
        Row: Flatten<Profile>;
        Insert: Flatten<Omit<Profile, "id" | "display_name" | "stripe_customer_id" | "stripe_subscription_id" | "subscription_status" | "subscribed_at"> & { id?: string; display_name?: string | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; subscription_status?: string | null; subscribed_at?: string | null }>;
        Update: Flatten<Partial<Profile>>;
        Relationships: [];
      };
      capital_flows: {
        Row: Flatten<CapitalFlow>;
        Insert: Flatten<Omit<CapitalFlow, "id" | "created_at" | "asset" | "quantity" | "price_per_unit" | "exchange" | "notes"> & { id?: string; created_at?: string; asset?: string | null; quantity?: number | null; price_per_unit?: number | null; exchange?: string | null; notes?: string | null }>;
        Update: Flatten<Partial<CapitalFlow>>;
        Relationships: [];
      };
      site_settings: {
        Row: Flatten<SiteSetting>;
        Insert: Flatten<Omit<SiteSetting, "updated_at"> & { updated_at?: string }>;
        Update: Flatten<Partial<SiteSetting>>;
        Relationships: [];
      };
      posts: {
        Row: Flatten<Post>;
        Insert: Flatten<Omit<Post, "id" | "created_at" | "subtitle" | "banner_path" | "banner_aspect" | "section" | "substack_url" | "content_json" | "content_md" | "draft_updated_at" | "editor_state"> & { id?: string; created_at?: string; subtitle?: string | null; banner_path?: string | null; banner_aspect?: string | null; section?: string | null; substack_url?: string | null; content_json?: unknown | null; content_md?: string | null; draft_updated_at?: string | null; editor_state?: EditorState }>;
        Update: Flatten<Partial<Post>>;
        Relationships: [];
      };
      email_preferences: {
        Row: Flatten<EmailPreferences>;
        Insert: Flatten<Omit<EmailPreferences, "daily_digest" | "digest_hour" | "updated_at"> & { daily_digest?: boolean; digest_hour?: number; updated_at?: string }>;
        Update: Flatten<Partial<EmailPreferences>>;
        Relationships: [];
      };
      pending_logins: {
        Row: Flatten<PendingLogin>;
        Insert: Flatten<Omit<PendingLogin, "id" | "created_at" | "expires_at" | "token_hash" | "verified_at"> & { id?: string; created_at?: string; expires_at?: string; token_hash?: string | null; verified_at?: string | null }>;
        Update: Flatten<Partial<PendingLogin>>;
        Relationships: [];
      };
      trades: {
        Row: Flatten<Trade>;
        Insert: Flatten<Omit<Trade, "id" | "synced_at" | "total_value_eur" | "fee" | "trade_id"> & { id?: string; synced_at?: string; total_value_eur?: number | null; fee?: number | null; trade_id?: string | null }>;
        Update: Flatten<Partial<Trade>>;
        Relationships: [
          { foreignKeyName: "trades_platform_id_fkey"; columns: ["platform_id"]; referencedRelation: "platforms"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      software: {
        Row: Flatten<Software>;
        Insert: Flatten<Omit<Software, "id" | "created_at" | "description" | "category" | "icon_path" | "is_active"> & { id?: string; created_at?: string; description?: string | null; category?: string | null; icon_path?: string | null; is_active?: boolean }>;
        Update: Flatten<Partial<Software>>;
        Relationships: [];
      };
      software_versions: {
        Row: Flatten<SoftwareVersion>;
        Insert: Flatten<Omit<SoftwareVersion, "id" | "release_notes" | "file_size" | "is_latest" | "released_at"> & { id?: string; release_notes?: string | null; file_size?: number | null; is_latest?: boolean; released_at?: string }>;
        Update: Flatten<Partial<SoftwareVersion>>;
        Relationships: [
          { foreignKeyName: "software_versions_software_id_fkey"; columns: ["software_id"]; referencedRelation: "software"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      downloads: {
        Row: Flatten<Download>;
        Insert: Flatten<Omit<Download, "id" | "created_at"> & { id?: string; created_at?: string }>;
        Update: Flatten<Partial<Download>>;
        Relationships: [
          { foreignKeyName: "downloads_version_id_fkey"; columns: ["version_id"]; referencedRelation: "software_versions"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      consultation_types: {
        Row: Flatten<ConsultationType>;
        Insert: Flatten<Omit<ConsultationType, "id" | "created_at" | "description" | "stripe_price_id" | "is_active"> & { id?: string; created_at?: string; description?: string | null; stripe_price_id?: string | null; is_active?: boolean }>;
        Update: Flatten<Partial<ConsultationType>>;
        Relationships: [];
      };
      availability_slots: {
        Row: Flatten<AvailabilitySlot>;
        Insert: Flatten<Omit<AvailabilitySlot, "id" | "created_at" | "day_of_week" | "specific_date" | "is_blocked"> & { id?: string; created_at?: string; day_of_week?: number | null; specific_date?: string | null; is_blocked?: boolean }>;
        Update: Flatten<Partial<AvailabilitySlot>>;
        Relationships: [];
      };
      consultations: {
        Row: Flatten<Consultation>;
        Insert: Flatten<Omit<Consultation, "id" | "created_at" | "status" | "stripe_payment_id" | "stripe_session_id" | "notes_user" | "notes_admin"> & { id?: string; created_at?: string; status?: string; stripe_payment_id?: string | null; stripe_session_id?: string | null; notes_user?: string | null; notes_admin?: string | null }>;
        Update: Flatten<Partial<Consultation>>;
        Relationships: [
          { foreignKeyName: "consultations_type_id_fkey"; columns: ["type_id"]; referencedRelation: "consultation_types"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      kronos_predictions: {
        Row: Flatten<KronosPrediction>;
        Insert: Flatten<Omit<KronosPrediction, "id" | "created_at" | "model" | "email" | "comment" | "input_range_start" | "input_range_end" | "pred_range_start" | "pred_range_end"> & { id?: string; created_at?: string; model?: string; email?: string | null; comment?: string | null; input_range_start?: string | null; input_range_end?: string | null; pred_range_start?: string | null; pred_range_end?: string | null }>;
        Update: Flatten<Partial<KronosPrediction>>;
        Relationships: [];
      };
      analyses: {
        Row: Flatten<Analysis>;
        // has_prediction is a generated column; never write to it. All non-required
        // fields are nullable with sensible defaults in the schema.
        Insert: Flatten<Partial<Omit<Analysis, "id" | "has_prediction">> & {
          slug: string;
          title: string;
        }>;
        Update: Flatten<Partial<Omit<Analysis, "has_prediction">>>;
        Relationships: [];
      };
      analysis_observations: {
        Row: Flatten<AnalysisObservation>;
        Insert: Flatten<Omit<AnalysisObservation, "id" | "created_at" | "source" | "note"> & { id?: string; created_at?: string; source?: ObservationSource | null; note?: string | null }>;
        Update: Flatten<Partial<AnalysisObservation>>;
        Relationships: [
          { foreignKeyName: "analysis_observations_analysis_id_fkey"; columns: ["analysis_id"]; referencedRelation: "analyses"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      analysis_snapshots: {
        Row: Flatten<AnalysisSnapshot>;
        Insert: Flatten<Omit<AnalysisSnapshot, "id" | "created_at" | "underlying" | "position" | "edge"> & { id?: string; created_at?: string; underlying?: TrackerUnderlying | null; position?: TrackerPosition | null; edge?: TrackerEdge | null }>;
        Update: Flatten<Partial<AnalysisSnapshot>>;
        Relationships: [
          { foreignKeyName: "analysis_snapshots_analysis_id_fkey"; columns: ["analysis_id"]; referencedRelation: "analyses"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
      analysis_events: {
        Row: Flatten<AnalysisEvent>;
        Insert: Flatten<Omit<AnalysisEvent, "id" | "created_at" | "payload" | "source" | "dedup_key"> & { id?: string; created_at?: string; payload?: Record<string, unknown> | null; source?: AnalysisEventSource | null; dedup_key?: string | null }>;
        Update: Flatten<Partial<AnalysisEvent>>;
        Relationships: [
          { foreignKeyName: "analysis_events_analysis_id_fkey"; columns: ["analysis_id"]; referencedRelation: "analyses"; referencedColumns: ["id"]; isOneToOne: false },
        ];
      };
    };
    Views: {
      positions_enriched: {
        Row: Flatten<PositionEnriched>;
        Relationships: [];
      };
      portfolio_summary: {
        Row: Flatten<PortfolioSummary>;
        Relationships: [];
      };
      trades_enriched: {
        Row: Flatten<TradeEnriched>;
        Relationships: [];
      };
      software_with_latest: {
        Row: Flatten<SoftwareWithLatest>;
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
