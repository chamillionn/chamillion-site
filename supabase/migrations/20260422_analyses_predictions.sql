-- Phase B: prediction tracking for analyses.
-- Adds optional prediction metadata to analyses and a child table for
-- periodic observations (manual and Binance-auto for crypto).

alter table public.analyses
  add column if not exists prediction_asset           text,
  add column if not exists prediction_source          text check (prediction_source is null or prediction_source in ('manual', 'binance')),
  add column if not exists prediction_direction       text check (prediction_direction is null or prediction_direction in ('bullish', 'bearish', 'neutral')),
  add column if not exists prediction_baseline_value  numeric,
  add column if not exists prediction_target_value    numeric,
  add column if not exists prediction_start_date      date,
  add column if not exists prediction_end_date        date,
  add column if not exists prediction_unit            text;

-- Derived flag: true when the analysis actually has a prediction worth tracking.
alter table public.analyses
  add column if not exists has_prediction boolean
    generated always as (
      prediction_direction is not null
      and prediction_start_date is not null
      and prediction_baseline_value is not null
    ) stored;

create index if not exists idx_analyses_has_prediction
  on public.analyses (has_prediction)
  where has_prediction = true;

-- Observations timeline.
create table if not exists public.analysis_observations (
  id          uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  observed_at timestamptz not null,
  value       numeric not null,
  source      text check (source is null or source in ('manual', 'binance', 'twelvedata')),
  note        text,
  created_at  timestamptz default now()
);

create index if not exists idx_analysis_observations_timeline
  on public.analysis_observations (analysis_id, observed_at desc);

-- Dedup window for auto-pulls — one observation per (analysis, day, source).
-- Cast timestamptz → date at UTC to keep the expression IMMUTABLE (a plain
-- date_trunc('day', <timestamptz>) is STABLE and rejected by unique indexes).
create unique index if not exists uq_analysis_observations_day
  on public.analysis_observations (
    analysis_id,
    source,
    ((observed_at at time zone 'UTC')::date)
  );

alter table public.analysis_observations enable row level security;

-- Observations inherit the parent analysis's visibility.
create policy "obs_select_by_parent_visibility"
  on public.analysis_observations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
      and (
        a.visibility = 'public'
        or (
          a.visibility = 'premium'
          and exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('member', 'admin')
          )
        )
        or (
          exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
          )
        )
      )
    )
  );

-- Writes via service-role client only (admin actions + Binance cron).
