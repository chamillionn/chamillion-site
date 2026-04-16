-- Trade history fetched from platform APIs (Hyperliquid fills, Polymarket trades, on-chain swaps).
-- Each row is a real execution, not an inferred diff.

create table if not exists public.trades (
  id              uuid primary key default gen_random_uuid(),
  platform_id     uuid references public.platforms(id),
  asset           text not null,
  side            text not null,        -- 'buy'|'sell'|'open_long'|'open_short'|'close_long'|'close_short'
  quantity        numeric not null,
  price           numeric not null,     -- price per unit in USD
  total_value     numeric not null,     -- quantity * price
  total_value_eur numeric,              -- converted at the EUR/USD rate at execution time
  fee             numeric,              -- platform fee in USD
  trade_id        text,                 -- unique ID from the platform (for deduplication)
  executed_at     timestamptz not null,
  synced_at       timestamptz not null default now()
);

alter table public.trades enable row level security;

-- Members can read all trades (chamillion's portfolio is visible to subscribers)
create policy "trades_select_authenticated"
  on public.trades for select
  to authenticated
  using (true);

-- Only service role can insert (sync engine)
-- No explicit INSERT policy = blocked for all non-service-role users

-- Deduplication: same platform + same trade_id = same trade
create unique index if not exists idx_trades_dedup
  on public.trades (platform_id, trade_id)
  where trade_id is not null;

-- Query pattern: recent trades by platform, ordered by time
create index if not exists idx_trades_platform_time
  on public.trades (platform_id, executed_at desc);

-- Query pattern: recent trades across all platforms
create index if not exists idx_trades_executed_at
  on public.trades (executed_at desc);

-- Enriched view with platform name
create or replace view public.trades_enriched as
  select
    t.id,
    t.asset,
    t.side,
    t.quantity,
    t.price,
    t.total_value,
    t.total_value_eur,
    t.fee,
    t.trade_id,
    t.executed_at,
    t.synced_at,
    t.platform_id,
    p.name as platform_name
  from public.trades t
  left join public.platforms p on p.id = t.platform_id
  order by t.executed_at desc;
