-- ============================================================
-- Harden SECURITY DEFINER functions
--
-- handle_new_user  — trigger, called by DB engine only
-- update_updated_at — trigger, called by DB engine only
-- is_admin         — used in RLS policies (keep EXECUTE for anon/authenticated)
--
-- Run in Supabase SQL Editor for BOTH dev and prod.
-- Idempotent: safe to run multiple times.
-- ============================================================


-- ── handle_new_user ──────────────────────────────────────────────────────────
-- Trigger function: fires on INSERT to auth.users to create a profile row.
-- anon/authenticated should never call this directly — REVOKE direct execute.

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;


-- ── update_updated_at ────────────────────────────────────────────────────────
-- Trigger function: sets updated_at on row changes.
-- Called only by DB triggers — REVOKE direct execute from user roles.

ALTER FUNCTION public.update_updated_at()
  SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM authenticated;


-- ── is_admin ─────────────────────────────────────────────────────────────────
-- Used in RLS policies — anon/authenticated MUST retain EXECUTE so policy
-- evaluation works. Only harden search_path to prevent schema injection.

ALTER FUNCTION public.is_admin()
  SET search_path = public, extensions;

-- DO NOT revoke anon/authenticated here — RLS policies depend on it.
-- service_role already has EXECUTE implicitly.
