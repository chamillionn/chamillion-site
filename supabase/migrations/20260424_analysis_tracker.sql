-- Tracker estándar para análisis con predicción.
-- Añade snapshots diarios (posición + edge + subyacente) y un event log
-- cronológico (órdenes puestas/llenas/canceladas, resolución).
--
-- Backward compat: la tabla analysis_observations se mantiene viva para
-- análisis sin `tracker` configurado en el registry.

-- 1. Snapshot diario agregado, una fila por (analysis × día)
create table if not exists public.analysis_snapshots (
  id            uuid primary key default gen_random_uuid(),
  analysis_id   uuid not null references public.analyses(id) on delete cascade,
  snapshot_date date not null,
  -- { value, unit, source, asOf }
  underlying    jsonb,
  -- { legs: [{name, side, size, avgPrice, curPrice, cashPnl, pnlPct, marketSlug}], totalCashPnl, totalNotional }
  position      jsonb,
  -- { evAbs, evPct, myProb, mktProb, source, note? }
  edge          jsonb,
  created_at    timestamptz default now(),
  unique (analysis_id, snapshot_date)
);

create index if not exists idx_analysis_snapshots_analysis_date
  on public.analysis_snapshots (analysis_id, snapshot_date desc);

-- 2. Event log cronológico
create table if not exists public.analysis_events (
  id          uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  occurred_at timestamptz not null,
  type        text not null check (type in (
    'order_placed',
    'order_filled',
    'order_cancelled',
    'position_opened',
    'position_closed',
    'resolution',
    'note'
  )),
  payload     jsonb,
  source      text check (source in ('polymarket', 'manual', 'kma', 'cron', 'binance', 'twelvedata')),
  dedup_key   text,
  created_at  timestamptz default now(),
  unique (analysis_id, dedup_key)
);

create index if not exists idx_analysis_events_timeline
  on public.analysis_events (analysis_id, occurred_at desc);

-- 3. Columnas de resolución en analyses
alter table public.analyses
  add column if not exists resolved_at    timestamptz,
  add column if not exists final_outcome  text,
  add column if not exists final_roi_pct  numeric;

-- CHECK constraint se añade por separado con IF NOT EXISTS via DO block (PG no tiene IF NOT EXISTS en constraints)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analyses_final_outcome_check'
  ) then
    alter table public.analyses
      add constraint analyses_final_outcome_check
      check (final_outcome is null or final_outcome in ('cumplida', 'fallida', 'neutral'));
  end if;
end $$;

-- 4. RLS: ambas tablas heredan la visibilidad del parent analysis
alter table public.analysis_snapshots enable row level security;
alter table public.analysis_events enable row level security;

drop policy if exists "snap_select_by_parent_visibility" on public.analysis_snapshots;
create policy "snap_select_by_parent_visibility"
  on public.analysis_snapshots for select
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

drop policy if exists "events_select_by_parent_visibility" on public.analysis_events;
create policy "events_select_by_parent_visibility"
  on public.analysis_events for select
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

-- Writes via service-role client only (cron + admin actions).
