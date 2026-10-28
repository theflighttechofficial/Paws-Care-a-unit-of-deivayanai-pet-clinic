-- Locks the Supabase Data API (PostgREST) out of every table in `public`.
--
-- The app never uses the Data API: the Express server connects directly as the
-- `postgres` role, which bypasses RLS. Enabling RLS with no policies makes
-- `anon` / `authenticated` see nothing; revoking grants closes the door twice.
-- Covers every current table (including app_settings) and, via default
-- privileges, tables created later. Safe to re-run. Apply in the Supabase SQL
-- editor or:
--   psql "$DATABASE_URL" -f server/db/enable_rls.sql

do $$
declare
  t record;
begin
  for t in
    select schemaname, tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
  end loop;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
    revoke all on all sequences in schema public from anon;
    revoke all on all functions in schema public from anon;
    alter default privileges in schema public revoke all on tables from anon;
    alter default privileges in schema public revoke all on sequences from anon;
    alter default privileges in schema public revoke all on functions from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
    revoke all on all sequences in schema public from authenticated;
    revoke all on all functions in schema public from authenticated;
    alter default privileges in schema public revoke all on tables from authenticated;
    alter default privileges in schema public revoke all on sequences from authenticated;
    alter default privileges in schema public revoke all on functions from authenticated;
  end if;
end $$;

-- Verify: every row must show rowsecurity = true.
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
