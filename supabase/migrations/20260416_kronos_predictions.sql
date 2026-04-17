-- Saved Kronos predictions. Public (for sharing).
-- Anyone can save a prediction with optional email + comment.

create table if not exists public.kronos_predictions (
  id                uuid primary key default gen_random_uuid(),
  symbol            text not null,
  timeframe         text not null,
  email             text,
  comment           text,
  input_candles     jsonb not null,
  predicted_candles jsonb not null,
  input_range_start timestamptz,
  input_range_end   timestamptz,
  pred_range_start  timestamptz,
  pred_range_end    timestamptz,
  created_at        timestamptz default now()
);

alter table public.kronos_predictions enable row level security;

create policy "kronos_select_public"
  on public.kronos_predictions for select
  to anon, authenticated
  using (true);

create policy "kronos_insert_public"
  on public.kronos_predictions for insert
  to anon, authenticated
  with check (true);

create index if not exists idx_kronos_predictions_recent
  on public.kronos_predictions (created_at desc);
