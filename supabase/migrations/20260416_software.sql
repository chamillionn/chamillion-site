-- Software catalog for downloadable tools, bots, and strategies.

create table if not exists public.software (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  category    text,       -- 'bot'|'tool'|'strategy'|'template'
  icon_path   text,       -- path to icon in /public/assets/
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table public.software enable row level security;

create policy "software_select_authenticated"
  on public.software for select
  to authenticated
  using (true);

-- Software versions with file references
create table if not exists public.software_versions (
  id            uuid primary key default gen_random_uuid(),
  software_id   uuid not null references public.software(id) on delete cascade,
  version       text not null,
  release_notes text,
  file_path     text not null,     -- Supabase Storage path
  file_size     bigint,
  is_latest     boolean default false,
  released_at   timestamptz default now()
);

alter table public.software_versions enable row level security;

create policy "versions_select_authenticated"
  on public.software_versions for select
  to authenticated
  using (true);

-- Download tracking
create table if not exists public.downloads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id),
  version_id uuid not null references public.software_versions(id),
  created_at timestamptz default now()
);

alter table public.downloads enable row level security;

create policy "downloads_insert_own"
  on public.downloads for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "downloads_select_admin"
  on public.downloads for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Enriched view: software with its latest version info
create or replace view public.software_with_latest as
  select
    s.id, s.slug, s.name, s.description, s.category,
    s.icon_path, s.is_active, s.created_at,
    v.id as latest_version_id,
    v.version as latest_version,
    v.release_notes as latest_release_notes,
    v.file_path as latest_file_path,
    v.file_size as latest_file_size,
    v.released_at as latest_released_at
  from public.software s
  left join public.software_versions v on v.software_id = s.id and v.is_latest = true
  where s.is_active = true
  order by s.created_at desc;
