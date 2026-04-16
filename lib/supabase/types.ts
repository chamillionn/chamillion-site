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

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  date: string; // YYYY-MM-DD
  banner_path: string | null;
  section: string | null; // e.g. "Reporte de la Cartera" | "Deep Dives"
  substack_url: string | null;
  premium: boolean;
  published: boolean;
  created_at: string;
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

export interface EmailPreferences {
  user_id: string;
  daily_digest: boolean;
  digest_hour: number;
  updated_at: string;
}

export type TradeSide = "buy" | "sell" | "open_long" | "open_short" | "close_long" | "close_short";

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
        Insert: Flatten<Omit<Post, "id" | "created_at" | "subtitle" | "banner_path" | "section" | "substack_url"> & { id?: string; created_at?: string; subtitle?: string | null; banner_path?: string | null; section?: string | null; substack_url?: string | null }>;
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
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
