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
  subscribed_at: string | null;
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

export interface PortfolioSummary {
  total_positions: number;
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_roi_pct: number;
}

/* ── Supabase generic Database type ── */

export interface Database {
  public: {
    Tables: {
      platforms: {
        Row: Platform;
        Insert: Omit<Platform, "id"> & { id?: string };
        Update: Partial<Platform>;
      };
      strategies: {
        Row: Strategy;
        Insert: Omit<Strategy, "id"> & { id?: string };
        Update: Partial<Strategy>;
      };
      positions: {
        Row: Position;
        Insert: Omit<Position, "id"> & { id?: string };
        Update: Partial<Position>;
      };
      snapshots: {
        Row: Snapshot;
        Insert: Omit<Snapshot, "id"> & { id?: string };
        Update: Partial<Snapshot>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id"> & { id?: string };
        Update: Partial<Profile>;
      };
      capital_flows: {
        Row: CapitalFlow;
        Insert: Omit<CapitalFlow, "id" | "created_at"> & { id?: string };
        Update: Partial<CapitalFlow>;
      };
    };
    Views: {
      positions_enriched: {
        Row: PositionEnriched;
      };
      portfolio_summary: {
        Row: PortfolioSummary;
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
