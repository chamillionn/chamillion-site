-- ============================================================
-- Fix: SECURITY DEFINER on views software_with_latest and trades_enriched
--
-- Problem: las views `public.software_with_latest` y `public.trades_enriched`
-- fueron creadas sin `security_invoker=true`, así que Postgres las trata como
-- SECURITY DEFINER — ejecutan con los privilegios del creador, bypasseando
-- RLS del usuario consultante.
--
-- Fix: convertirlas a SECURITY INVOKER. Las tablas subyacentes ya tienen
-- RLS activa con SELECT policies apropiadas:
--   - public.software, public.software_versions: RLS on, SELECT para authenticated
--     (migración 20260416_software.sql)
--   - public.trades: RLS on, SELECT para authenticated
--   - public.platforms: RLS on, SELECT para anon+authenticated
--     (migración 20260305_fix_security_definer_views.sql)
--
-- Idempotente: `ALTER VIEW ... SET` es seguro de ejecutar múltiples veces.
-- Aplicar en dev Y prod Supabase (ambos están flaggeados por el advisor).
-- ============================================================

ALTER VIEW public.software_with_latest SET (security_invoker = true);
ALTER VIEW public.trades_enriched      SET (security_invoker = true);
