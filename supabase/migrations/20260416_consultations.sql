-- Consultation booking system.

-- Types of sessions (defined by admin)
create table if not exists public.consultation_types (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  duration        int not null,          -- minutes
  price_eur       numeric not null,
  stripe_price_id text,                  -- Stripe Price ID (one-time)
  is_active       boolean default true,
  created_at      timestamptz default now()
);

alter table public.consultation_types enable row level security;

create policy "consultation_types_select"
  on public.consultation_types for select
  to authenticated
  using (true);

-- Admin's availability schedule
create table if not exists public.availability_slots (
  id            uuid primary key default gen_random_uuid(),
  day_of_week   int,                     -- 0=Sun..6=Sat (null for specific date overrides)
  specific_date date,                    -- one-off availability/blocks
  start_time    time not null,
  end_time      time not null,
  is_blocked    boolean default false,   -- true = unavailable override
  created_at    timestamptz default now()
);

alter table public.availability_slots enable row level security;

create policy "availability_select"
  on public.availability_slots for select
  to authenticated
  using (true);

-- Bookings
create table if not exists public.consultations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id),
  type_id           uuid not null references public.consultation_types(id),
  scheduled_at      timestamptz not null,
  duration          int not null,        -- minutes
  status            text default 'pending',  -- 'pending'|'confirmed'|'completed'|'canceled'
  stripe_payment_id text,
  stripe_session_id text,
  notes_user        text,
  notes_admin       text,
  created_at        timestamptz default now()
);

alter table public.consultations enable row level security;

create policy "consultations_select_own"
  on public.consultations for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "consultations_insert_own"
  on public.consultations for insert
  to authenticated
  with check (user_id = auth.uid());

-- Anti-double-booking: checks if a time slot is available
create or replace function public.check_slot_available(p_scheduled_at timestamptz, p_duration int)
returns boolean as $$
  select not exists (
    select 1 from public.consultations
    where status in ('pending', 'confirmed')
    and tstzrange(scheduled_at, scheduled_at + (duration || ' minutes')::interval)
    && tstzrange(p_scheduled_at, p_scheduled_at + (p_duration || ' minutes')::interval)
  );
$$ language sql security definer set search_path = public;
