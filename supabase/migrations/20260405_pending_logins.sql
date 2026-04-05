-- Cross-device magic link authentication.
-- Tracks pending login requests so the original device can detect
-- when the magic link is verified on another device and obtain its own session.

create table if not exists public.pending_logins (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

-- RLS enabled with no policies = only service role can access
alter table public.pending_logins enable row level security;

create index if not exists idx_pending_logins_expires
  on public.pending_logins (expires_at);
