-- Email notification preferences per user.
-- daily_digest: opt-in daily summary of trades.
-- digest_hour: UTC hour to send (default 8 = 10:00 Madrid).

create table if not exists public.email_preferences (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  daily_digest boolean default false,
  digest_hour  int default 8,
  updated_at   timestamptz default now()
);

alter table public.email_preferences enable row level security;

create policy "email_prefs_own_row"
  on public.email_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
