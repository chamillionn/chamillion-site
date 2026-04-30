-- Add forecasts column to analysis_snapshots for Open-Meteo data
alter table public.analysis_snapshots
  add column if not exists forecasts jsonb;
