-- ============================================================
-- Drop admin write policies from tables
--
-- All admin writes now go through server actions that use the
-- service role client (admin.dataClient), which bypasses RLS.
-- These RLS write policies were the previous mechanism but are
-- no longer needed — keeping them open a direct-write path via
-- an admin JWT without going through the server actions layer.
--
-- After this migration:
--   - Reads: anon/authenticated can SELECT (via existing read policies)
--   - Writes: service role only (bypasses RLS — server actions only)
--
-- Run in Supabase SQL Editor for both dev and prod.
-- Idempotent: DROP POLICY IF EXISTS is safe to run multiple times.
-- ============================================================

-- positions
DROP POLICY IF EXISTS "Positions: admin insert" ON public.positions;
DROP POLICY IF EXISTS "Positions: admin update" ON public.positions;
DROP POLICY IF EXISTS "Positions: admin delete" ON public.positions;

-- platforms
DROP POLICY IF EXISTS "Platforms: admin insert" ON public.platforms;
DROP POLICY IF EXISTS "Platforms: admin update" ON public.platforms;
DROP POLICY IF EXISTS "Platforms: admin delete" ON public.platforms;

-- strategies
DROP POLICY IF EXISTS "Strategies: admin insert" ON public.strategies;
DROP POLICY IF EXISTS "Strategies: admin update" ON public.strategies;
DROP POLICY IF EXISTS "Strategies: admin delete" ON public.strategies;

-- snapshots (admin-only table — also remove any anon/authenticated read if present)
DROP POLICY IF EXISTS "Snapshots: admin insert" ON public.snapshots;
DROP POLICY IF EXISTS "Snapshots: admin update" ON public.snapshots;
DROP POLICY IF EXISTS "Snapshots: admin delete" ON public.snapshots;

-- capital_flows (admin-only table)
DROP POLICY IF EXISTS "Capital flows: admin insert" ON public.capital_flows;
DROP POLICY IF EXISTS "Capital flows: admin update" ON public.capital_flows;
DROP POLICY IF EXISTS "Capital flows: admin delete" ON public.capital_flows;

-- posts
DROP POLICY IF EXISTS "Posts: admin insert" ON public.posts;
DROP POLICY IF EXISTS "Posts: admin update" ON public.posts;
DROP POLICY IF EXISTS "Posts: admin delete" ON public.posts;

-- profiles (role updates go through service role in server actions)
DROP POLICY IF EXISTS "Profiles: admin update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin delete" ON public.profiles;
