-- Paws & Care — self-hosted Postgres schema.
--
-- Replaces Supabase entirely: no Row Level Security, no auth.users, no
-- PostgREST. profiles is now the root identity table (email + password
-- hash live here) and all authorization is enforced in the Express API.
--
-- Run once against an empty database:
--   psql "$DATABASE_URL" -f server/db/schema.sql

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  phone text,
  role text not null default 'owner' check (role in ('owner', 'doctor', 'admin')),
  avatar_url text,
  reset_token_hash text,
  reset_token_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  specialization text,
  experience integer,
  bio text,
  availability jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  gender text,
  date_of_birth date,
  weight numeric,
  color text,
  microchip_id text,
  profile_image text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  pet_id uuid not null references public.pets(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  service text not null,
  consultation_type text not null,
  appointment_date date not null,
  appointment_time time not null,
  duration integer default 30,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  google_calendar_event_id text,
  google_meet_url text,
  google_sync_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists appointments_doctor_slot_unique
  on public.appointments (doctor_id, appointment_date, appointment_time)
  where status <> 'cancelled';

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  symptoms text,
  clinical_notes text,
  diagnosis text,
  treatment text,
  prescription jsonb default '[]'::jsonb,
  vitals jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Single shared "connected" Google account used to create real Calendar
-- events + auto-generated Meet links (OAuth user consent, not a bare
-- service account — Google rejects Meet/attendee creation from a service
-- account without Workspace Domain-Wide Delegation). Singleton table: the
-- boolean PK forced to `true` means there is ever at most one row.
create table if not exists public.google_calendar_connection (
  id boolean primary key default true,
  connected_email text,
  refresh_token text not null,
  access_token text,
  token_expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_calendar_connection_singleton check (id)
);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

drop trigger if exists set_doctors_updated_at on public.doctors;
create trigger set_doctors_updated_at
before update on public.doctors
for each row execute function public.update_updated_at();

drop trigger if exists set_pets_updated_at on public.pets;
create trigger set_pets_updated_at
before update on public.pets
for each row execute function public.update_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.update_updated_at();

drop trigger if exists set_medical_records_updated_at on public.medical_records;
create trigger set_medical_records_updated_at
before update on public.medical_records
for each row execute function public.update_updated_at();

drop trigger if exists set_google_calendar_connection_updated_at on public.google_calendar_connection;
create trigger set_google_calendar_connection_updated_at
before update on public.google_calendar_connection
for each row execute function public.update_updated_at();
