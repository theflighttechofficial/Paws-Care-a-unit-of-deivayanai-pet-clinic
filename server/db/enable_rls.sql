-- Locks the Supabase Data API (PostgREST) out of every app table.
--
-- The app never uses the Data API: the Express server connects directly as the
-- `postgres` role, which bypasses RLS. Enabling RLS with no policies makes
-- `anon` / `authenticated` see nothing; revoking grants closes the door twice.
-- Safe to re-run. Apply in the Supabase SQL editor or:
--   psql "$DATABASE_URL" -f server/db/enable_rls.sql

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'doctors', 'pets', 'appointments', 'services', 'payments',
    'appointment_ratings', 'doctor_leaves', 'medical_records',
    'google_calendar_connection'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
    revoke all on all sequences in schema public from anon;
    revoke all on all functions in schema public from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
    revoke all on all sequences in schema public from authenticated;
    revoke all on all functions in schema public from authenticated;
  end if;
end $$;
