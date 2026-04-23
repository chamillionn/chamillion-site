-- Análisis module: curated investment theses / asset research.
-- Admin-authored content with three visibility states and a separate
-- admin-only notes column for the extended Claude Code research log.

create table if not exists public.analyses (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  subtitle        text,
  asset           text,              -- free-form tag (e.g. "copper", "BTC", "AAPL")
  thesis          text,              -- one-line summary ("bullish copper 2026")
  section         text,              -- e.g. "Deep Dive", "Macro", "Cripto"
  banner_path     text,              -- relative path to banner image in /public
  summary_md      text not null default '',  -- public-facing markdown body
  admin_notes_md  text,              -- admin-only curated log; NEVER sent to non-admin
  visibility      text not null default 'hidden'
                    check (visibility in ('public', 'premium', 'hidden')),
  published_at    timestamptz,       -- sealed when visibility flips off 'hidden'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_analyses_visibility_published
  on public.analyses (visibility, published_at desc);

alter table public.analyses enable row level security;

-- Public analyses: anyone can read (only PUBLIC_COLUMNS should ever be selected
-- by non-admin queries; RLS is the second line of defense against admin_notes leak).
create policy "analyses_select_public"
  on public.analyses for select
  to anon, authenticated
  using (visibility = 'public');

-- Premium analyses: members + admins.
create policy "analyses_select_member"
  on public.analyses for select
  to authenticated
  using (
    visibility = 'premium'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('member', 'admin')
    )
  );

-- Hidden (and any state): admins.
create policy "analyses_select_admin"
  on public.analyses for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- No INSERT/UPDATE/DELETE policies: admin writes go through service-role client,
-- matching the convention in 20260305_drop_admin_write_policies.sql.
