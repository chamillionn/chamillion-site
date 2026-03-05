-- ============================================================
-- Fix: SECURITY DEFINER views on positions_enriched and portfolio_summary
--
-- Problem: both views run with the owner's privileges (bypasses RLS).
-- Any role that can SELECT the view sees all data regardless of policies.
--
-- Fix:
--   1. Add anon/authenticated SELECT policies on the underlying public tables
--      (positions, platforms, strategies) — these are public portfolio data.
--   2. Convert the views to SECURITY INVOKER so they respect the caller's RLS.
--
-- Run this in Supabase SQL Editor (dashboard → SQL Editor → New query).
-- Idempotent: safe to run multiple times.
-- ============================================================


-- ── Step 1: Ensure RLS is enabled on underlying public tables ──────────────

ALTER TABLE public.positions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;


-- ── Step 2: Public read policies (portfolio data is intentionally public) ──

DROP POLICY IF EXISTS "public_select_positions"  ON public.positions;
DROP POLICY IF EXISTS "public_select_platforms"  ON public.platforms;
DROP POLICY IF EXISTS "public_select_strategies" ON public.strategies;

-- Anyone (anon or authenticated) can read portfolio positions
CREATE POLICY "public_select_positions"
  ON public.positions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can read platform metadata
CREATE POLICY "public_select_platforms"
  ON public.platforms
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can read strategy metadata
CREATE POLICY "public_select_strategies"
  ON public.strategies
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- ── Step 3: Convert views from SECURITY DEFINER → SECURITY INVOKER ─────────
--
-- After this, the views execute with the querying user's privileges and
-- respect RLS. The SELECT policies added above ensure anon can still read.

ALTER VIEW public.positions_enriched  SET (security_invoker = true);
ALTER VIEW public.portfolio_summary   SET (security_invoker = true);
