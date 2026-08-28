// One-time IN-PLACE migration for when the new backend targets the SAME
// Postgres database that used to be driven by Supabase (DATABASE_URL ==
// the Supabase project's native Postgres connection string).
//
// There is nothing to copy here — the data (profiles, doctors, pets,
// appointments, medical_records) already lives in this database. What's
// missing is the shape the custom Express backend needs:
//   - profiles.email / profiles.password_hash (previously lived in
//     Supabase's separate `auth.users` table, which this app no longer uses)
//   - no more dependency on `auth.users` (FK dropped)
//   - RLS/policies disabled (authorization now lives entirely in Express)
//   - the Supabase auth trigger removed (nothing creates auth.users rows anymore)
//
// SAFETY: Idempotent (every step checks before acting) and additive except
// for the two `drop`s explicitly described above (the auth.users FK
// constraint and the now-pointless trigger/function) — no table, row, or
// column is ever deleted. bruno and every other existing row is untouched
// aside from gaining an email/password_hash.
//
// Usage:
//   node server/scripts/migrateSupabaseSchemaInPlace.js
//
// Requires DATABASE_URL in .env.

import bcrypt from "bcryptjs"
import crypto from "crypto"
import dotenv from "dotenv"
import pg from "pg"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 })

const generatePassword = () => crypto.randomBytes(9).toString("base64url")

const credentials = []

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [table, column]
  )
  return rows.length > 0
}

async function ensureIdDefault() {
  // Supabase's original profiles.id had no default — it always came from
  // auth.users. Without this, every future insert (register, seed scripts)
  // fails with "null value in column id".
  await pool.query("create extension if not exists pgcrypto")
  await pool.query("alter table public.profiles alter column id set default gen_random_uuid()")
  console.log("Ensured profiles.id defaults to gen_random_uuid()")
}

async function addProfileColumns() {
  if (!(await columnExists("profiles", "email"))) {
    await pool.query("alter table public.profiles add column email text")
    console.log("Added profiles.email")
  }
  if (!(await columnExists("profiles", "password_hash"))) {
    await pool.query("alter table public.profiles add column password_hash text")
    console.log("Added profiles.password_hash")
  }
}

async function backfillEmails() {
  // auth.users only exists in a Supabase-provisioned database. If it's
  // gone (e.g. this script is re-run after Supabase Auth was already torn
  // down), skip — emails are assumed already backfilled.
  const { rows: authTableExists } = await pool.query(
    `select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users'`
  )
  if (authTableExists.length === 0) {
    console.log("auth.users not found — skipping email backfill (assumed already done).")
    return
  }

  const { rowCount } = await pool.query(`
    update public.profiles p
    set email = u.email
    from auth.users u
    where u.id = p.id and p.email is null
  `)
  console.log(`Backfilled email for ${rowCount} profile(s) from auth.users.`)
}

async function backfillPasswords() {
  const { rows } = await pool.query("select id, email, role from public.profiles where password_hash is null")

  for (const row of rows) {
    if (!row.email) {
      console.warn(`Skipping profile ${row.id} — no email available to assign a password to.`)
      continue
    }
    const password = generatePassword()
    const passwordHash = await bcrypt.hash(password, 12)
    await pool.query("update public.profiles set password_hash = $2 where id = $1", [row.id, passwordHash])
    credentials.push({ email: row.email, role: row.role, password })
  }

  console.log(`Generated temporary passwords for ${rows.length} profile(s).`)
}

async function enforceNotNull() {
  const { rows: stillNull } = await pool.query(
    "select count(*)::int as count from public.profiles where email is null or password_hash is null"
  )
  if (stillNull[0].count > 0) {
    console.warn(`${stillNull[0].count} profile(s) still missing email/password_hash — leaving columns nullable for now.`)
    return
  }

  await pool.query("alter table public.profiles alter column email set not null")
  await pool.query("alter table public.profiles alter column password_hash set not null")

  const { rows: uniqueExists } = await pool.query(`
    select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'u' and conname = 'profiles_email_key'
  `)
  if (uniqueExists.length === 0) {
    await pool.query("alter table public.profiles add constraint profiles_email_key unique (email)")
    console.log("Added unique constraint on profiles.email")
  }
}

async function dropAuthUsersForeignKey() {
  const { rows } = await pool.query(`
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'f'
  `)
  for (const { conname } of rows) {
    await pool.query(`alter table public.profiles drop constraint ${conname}`)
    console.log(`Dropped foreign key constraint profiles.${conname} (was referencing auth.users)`)
  }
}

async function dropRlsAndPolicies() {
  const tables = ["profiles", "doctors", "pets", "appointments", "medical_records"]

  for (const table of tables) {
    const { rows: policies } = await pool.query(
      "select policyname from pg_policies where schemaname = 'public' and tablename = $1",
      [table]
    )
    for (const { policyname } of policies) {
      await pool.query(`drop policy if exists "${policyname}" on public.${table}`)
    }
    if (policies.length) console.log(`Dropped ${policies.length} polic${policies.length === 1 ? "y" : "ies"} on ${table}`)

    await pool.query(`alter table public.${table} disable row level security`)
  }
  console.log("RLS disabled on all tables — authorization now lives entirely in the Express API.")
}

async function dropAuthTrigger() {
  const { rows: authTableExists } = await pool.query(
    `select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users'`
  )
  if (authTableExists.length === 0) return

  await pool.query("drop trigger if exists on_auth_user_created on auth.users")
  await pool.query("drop function if exists public.handle_new_user()")
  console.log("Dropped the Supabase auth.users -> profiles trigger (no longer used).")
}

async function main() {
  await ensureIdDefault()
  await addProfileColumns()
  await backfillEmails()
  await backfillPasswords()
  await enforceNotNull()
  await dropAuthUsersForeignKey()
  await dropRlsAndPolicies()
  await dropAuthTrigger()

  if (credentials.length) {
    console.log("\n=== TEMPORARY PASSWORDS (shown once, not stored in plaintext anywhere) ===")
    credentials.forEach(({ email, role, password }) => console.log(`${email} (${role}): ${password}`))
  }

  console.log("\nDone. No rows were deleted; only profiles gained email/password_hash, the auth.users FK and RLS were removed.")
  await pool.end()
}

main().catch((err) => {
  console.error("In-place migration failed:", err.message)
  process.exit(1)
})
