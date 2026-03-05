-- ============================================================
-- Audit + harden SECURITY DEFINER functions
--
-- Step 1: Run the SELECT to see all SECURITY DEFINER functions.
-- Step 2: For each function that appears, verify it has
--         SET search_path = public, extensions
--         and is only executable by service_role (or the appropriate role).
--
-- Run in Supabase SQL Editor for both dev and prod.
-- ============================================================


-- ── Audit: list all SECURITY DEFINER functions ──────────────────────────────

SELECT
  n.nspname                          AS schema,
  p.proname                          AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef                        AS security_definer,
  p.proconfig                        AS config  -- should contain 'search_path=public,extensions'
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;


-- ── Audit: list function grants (check for anon/authenticated execute) ───────

SELECT
  routine_schema,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY routine_name, grantee;


-- ── Fix template: apply to each SECURITY DEFINER function found above ────────
--
-- Replace <function_name> and <args> with the actual values from the audit.
-- This sets search_path and revokes execute from anon/authenticated.
--
-- Example (uncomment and adapt):
--
-- ALTER FUNCTION public.<function_name>(<args>)
--   SET search_path = public, extensions;
--
-- REVOKE EXECUTE ON FUNCTION public.<function_name>(<args>) FROM anon;
-- REVOKE EXECUTE ON FUNCTION public.<function_name>(<args>) FROM authenticated;
-- GRANT  EXECUTE ON FUNCTION public.<function_name>(<args>) TO service_role;
