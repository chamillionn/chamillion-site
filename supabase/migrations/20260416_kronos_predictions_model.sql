-- Add model column to kronos_predictions (mini, small, base).
-- Defaults to 'small' for backwards compat with rows created before multi-model support.

alter table public.kronos_predictions
  add column if not exists model text default 'small';
